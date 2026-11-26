import { memo, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useTheme, type Sky, type SkyShape } from "@/lib/theme";

/**
 * Gece gökyüzü: web'deki özel panelin arka planı.
 *
 * Katmanlar alttan üste: düz zemin → iki renkli parıltı → yıldız alanı →
 * kayan şekiller → kenar karartması. Hepsi dokunmaları geçirir ve ekran
 * okuyuculardan gizlidir.
 *
 * Web'deki kalplerin yerini temaya göre değişen şekiller aldı (gül yaprakları,
 * baloncuklar, yapraklar, yıldızlar…). Şekil seçimi ve renkleri `getSky`'dan
 * gelir; bu dosya yalnızca çizer ve hareket ettirir.
 *
 * Bütün animasyonlar yerel sürücüde (`useNativeDriver`) çalışır: JS iş
 * parçacığı her karede uğraşmaz, ekran kaydırılırken de akıcı kalır. Her
 * parçacığın kendi sonsuz döngüsü var ama başlangıç noktası `Animated.modulo`
 * ile kaydırılıyor — böylece açılışta hepsi aynı anda kenardan girmez, gökyüzü
 * ilk karede dolu görünür (web'deki negatif `animation-delay`'in karşılığı).
 *
 * Performans: ucuz telefonlarda da akıcı kalsın diye animasyonlu düğüm sayısı
 * bilerek düşük tutuldu (~25). Yıldızlar tek tek görünüm değil, katman başına
 * birkaç SVG'de toplu çizilir; titreşim yıldız başına değil grup başınadır.
 * Hale gölge filtresiyle değil yarı saydam bir daireyle çizilir. Uygulama arka
 * plana geçince bütün döngüler durur, öne gelince kaldıkları yerden sürer.
 */

// ── Yıldızlar ──────────────────────────────────────────────────────────────

/** Konumlar ekrana oranla (0–1); boyutlar piksel. */
type Star = { x: number; y: number; size: number; opacity: number };

type StarLayer = {
  share: number;
  size: [number, number];
  opacity: [number, number];
  /** Katmanın kayma genliği (ekran genişliğine oran). Büyüdükçe yakın hissi. */
  pan: number;
  panDuration: number;
  /** Hale yarıçapının boyuta oranı. 0 ise hale yok. */
  glow: number;
  /**
   * Titreşim grubu sayısı. 0 ise katman durgun. Her grup tek bir SVG ve tek
   * bir döngü; gruplar farklı hız ve evrede titreştiği için göz bunu tek tek
   * yıldızların titreşimi gibi okuyor.
   */
  twinkleGroups: number;
};

/** Telefon için web'deki 420'nin yoğunluk ayarlı karşılığı. */
const STAR_COUNT = 300;

const STAR_LAYERS: StarLayer[] = [
  { share: 0.7, size: [0.8, 1.5], opacity: [0.14, 0.36], pan: 0.008, panDuration: 140000, glow: 0, twinkleGroups: 0 },
  { share: 0.21, size: [1.3, 2.1], opacity: [0.3, 0.62], pan: 0.02, panDuration: 95000, glow: 3, twinkleGroups: 3 },
  { share: 0.09, size: [2, 3], opacity: [0.55, 0.95], pan: 0.04, panDuration: 62000, glow: 4, twinkleGroups: 3 },
];

function random([min, max]: [number, number]) {
  return min + Math.random() * (max - min);
}

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

function createStars(count: number, layer: StarLayer): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: random(layer.size),
    opacity: random(layer.opacity),
  }));
}

/** Katmanın yıldızlarını titreşim gruplarına böler; her grubun kendi hızı ve evresi var. */
function createStarGroups(layer: StarLayer) {
  const stars = createStars(Math.max(3, Math.round(STAR_COUNT * layer.share)), layer);
  const count = Math.max(1, layer.twinkleGroups);
  return Array.from({ length: count }, (_, group) => ({
    stars: stars.filter((_, index) => index % count === group),
    duration: 2600 + Math.random() * 4200,
    offset: Math.random(),
  }));
}

/**
 * 0→1 arasında sonsuz dönen, başlangıcı `offset` kadar kaydırılmış ilerleme.
 *
 * `enabled` false olunca döngü durur; yeniden açılınca kaldığı yerden devam
 * eder (ilk tur kalan süre kadar, sonra tam turlar). Böylece arka plandan
 * dönüşte şekiller yerinden sıçramaz.
 */
function useLoop(duration: number, offset: number, enabled: boolean) {
  const progress = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let running: Animated.CompositeAnimation | null = null;
    const timing = (from: number) =>
      Animated.timing(progress, {
        toValue: 1,
        duration: Math.max(1, duration * (1 - from)),
        easing: Easing.linear,
        useNativeDriver: true,
      });

    progress.stopAnimation((value) => {
      if (cancelled) return;
      running = timing(value);
      running.start(({ finished }) => {
        if (!finished || cancelled) return;
        progress.setValue(0);
        running = Animated.loop(timing(0));
        running.start();
      });
    });

    return () => {
      cancelled = true;
      running?.stop();
    };
  }, [progress, duration, enabled]);

  return useMemo(() => Animated.modulo(Animated.add(progress, offset), 1), [progress, offset]);
}

/** Bir grup yıldızı tek SVG'de çizer; hale yıldızın altında soluk bir daire. */
function StarSvg({
  stars,
  width,
  height,
  halo,
  glow,
}: {
  stars: Star[];
  width: number;
  height: number;
  halo: string;
  glow: number;
}) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {glow > 0 &&
        stars.map((star, index) => (
          <Circle
            key={`h${index}`}
            cx={star.x * width}
            cy={star.y * height}
            r={(star.size * glow) / 2}
            fill={halo}
            opacity={star.opacity * 0.22}
          />
        ))}
      {stars.map((star, index) => (
        <Circle
          key={index}
          cx={star.x * width}
          cy={star.y * height}
          r={star.size / 2}
          fill="#ffffff"
          opacity={star.opacity}
        />
      ))}
    </Svg>
  );
}

const TwinkleGroup = memo(function TwinkleGroup({
  stars,
  width,
  height,
  halo,
  glow,
  duration,
  offset,
  animated,
}: {
  stars: Star[];
  width: number;
  height: number;
  halo: string;
  glow: number;
  duration: number;
  offset: number;
  animated: boolean;
}) {
  const phase = useLoop(duration, offset, animated);
  const opacity = phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] });
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: animated ? opacity : 1 }]}
      renderToHardwareTextureAndroid
    >
      <StarSvg stars={stars} width={width} height={height} halo={halo} glow={glow} />
    </Animated.View>
  );
});

const StarLayerView = memo(function StarLayerView({
  layer,
  width,
  height,
  halo,
  animated,
}: {
  layer: StarLayer;
  width: number;
  height: number;
  halo: string;
  animated: boolean;
}) {
  // Yıldızlar ve gruplar bir kez üretilir; ekran döndürülünce yalnızca
  // konumlar yeni boyuta ölçeklenir.
  const groups = useMemo(() => createStarGroups(layer), [layer]);

  const phase = useLoop(layer.panDuration, 0, animated);
  const shift = width * layer.pan;
  // Git-gel kayma: yarı yolda en uçta, döngü sonunda başa döner (web'deki `alternate`).
  const translateX = phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -shift, 0] });
  const translateY = phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, shift * 0.6, 0] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { translateY }] }]}
      renderToHardwareTextureAndroid
    >
      {layer.twinkleGroups === 0 ? (
        <StarSvg stars={groups[0]?.stars ?? []} width={width} height={height} halo={halo} glow={layer.glow} />
      ) : (
        groups.map((group, index) => (
          <TwinkleGroup
            key={index}
            stars={group.stars}
            width={width}
            height={height}
            halo={halo}
            glow={layer.glow}
            duration={group.duration}
            offset={group.offset}
            animated={animated}
          />
        ))
      )}
    </Animated.View>
  );
});

// ── Kayan şekiller ────────────────────────────────────────────────────────

/** Arkasında kuyruk bırakan şekiller: kayan yıldız benzetmesi. */
const TAILED: ReadonlySet<SkyShape> = new Set(["sparkle", "star", "moon"]);
/** Süzülürken kendi etrafında dönen şekiller: rüzgârdaki yaprak gibi. */
const SPINNING: ReadonlySet<SkyShape> = new Set(["petal", "leaf", "flower"]);

type Drifter = {
  shape: SkyShape;
  top: number;
  size: number;
  offset: number;
  duration: number;
  drift: number;
  angle: number;
  opacity: number;
  toRight: boolean;
  spin: number;
};

/**
 * `calm` ton: uzun süre açık kalan ekranlar için az, yavaş ve silik. Web'e
 * göre biraz daha iri ve belirgin — telefonda şekil ayrıntısı ancak böyle
 * seçiliyor.
 */
const DRIFTER = {
  count: 14,
  size: [12, 30] as [number, number],
  duration: [14000, 26000] as [number, number],
  opacity: [0.25, 0.72] as [number, number],
};

function createDrifters(shapes: readonly SkyShape[]): Drifter[] {
  return Array.from({ length: DRIFTER.count }, () => {
    // Derinlik: iri olan hızlı ve belirgin (yakın), küçük olan yavaş ve sönük.
    const nearness = Math.random();
    return {
      shape: shapes[Math.floor(Math.random() * shapes.length)] ?? "sparkle",
      top: Math.random() * 100,
      size: lerp(DRIFTER.size[0], DRIFTER.size[1], nearness),
      offset: Math.random(),
      duration: lerp(DRIFTER.duration[1], DRIFTER.duration[0], nearness),
      drift: (Math.random() - 0.5) * 90,
      angle: -18 + Math.random() * 12,
      opacity: lerp(DRIFTER.opacity[0], DRIFTER.opacity[1], nearness),
      toRight: Math.random() < 0.5,
      spin: (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 240),
    };
  });
}

const DriftingShape = memo(function DriftingShape({
  drifter,
  color,
  width,
  height,
  id,
  animated,
}: {
  drifter: Drifter;
  color: string;
  width: number;
  height: number;
  id: string;
  animated: boolean;
}) {
  const phase = useLoop(drifter.duration, drifter.offset, animated);
  const tailed = TAILED.has(drifter.shape);
  const tail = tailed ? drifter.size * 4 : 0;
  const itemWidth = tail + drifter.size;

  // Ekranın dışından girip diğer kenardan çıkar. Ters yöndekiler aynayla
  // çevrilir: kuyruk her zaman hareketin arkasında kalsın.
  const from = -itemWidth - width * 0.1;
  const to = width * 1.1;
  const translateX = phase.interpolate({
    inputRange: [0, 1],
    outputRange: drifter.toRight ? [from, to] : [to, from],
  });
  const translateY = phase.interpolate({ inputRange: [0, 1], outputRange: [0, drifter.drift] });
  const scale = phase.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const opacity = phase.interpolate({
    inputRange: [0, 0.12, 0.82, 1],
    outputRange: [0, drifter.opacity, drifter.opacity, 0],
  });
  const spin = phase.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${drifter.spin}deg`] });

  return (
    <Animated.View
      // Şekil bir kez rasterleştirilip ekran kartında taşınır; her karede
      // SVG yeniden çizilmez.
      renderToHardwareTextureAndroid
      style={{
        position: "absolute",
        left: 0,
        top: (drifter.top / 100) * height,
        width: itemWidth,
        height: drifter.size,
        opacity,
        transform: [
          { translateX },
          { translateY },
          { rotate: `${drifter.angle}deg` },
          { scaleX: drifter.toRight ? 1 : -1 },
          { scale },
        ],
      }}
    >
      {tailed && (
        <Svg width={tail + drifter.size * 0.4} height={drifter.size} style={{ position: "absolute", left: 0, top: 0 }}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color} stopOpacity={0} />
              <Stop offset="1" stopColor={color} stopOpacity={0.55} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={drifter.size / 2 - 1}
            width={tail + drifter.size * 0.4}
            height={2}
            rx={1}
            fill={`url(#${id})`}
          />
        </Svg>
      )}
      <Animated.View
        style={{
          position: "absolute",
          left: tail,
          width: drifter.size,
          height: drifter.size,
          transform: SPINNING.has(drifter.shape) ? [{ rotate: spin }] : undefined,
        }}
      >
        <ShapeGlyph shape={drifter.shape} color={color} size={drifter.size} />
      </Animated.View>
    </Animated.View>
  );
});

/** Şekillerin çizimi; hepsi 24×24 görünüm kutusunda. */
export function ShapeGlyph({ shape, color, size }: { shape: SkyShape; color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderShape(shape, color)}
    </Svg>
  );
}

const PETAL_ANGLES = [0, 72, 144, 216, 288];

function renderShape(shape: SkyShape, color: string) {
  switch (shape) {
    case "sparkle":
      return (
        <Path
          d="M12 1.5C12.7 8 16 11.3 22.5 12 16 12.7 12.7 16 12 22.5 11.3 16 8 12.7 1.5 12 8 11.3 11.3 8 12 1.5Z"
          fill={color}
        />
      );
    case "star":
      return <Path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill={color} />;
    case "moon":
      return <Path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" fill={color} />;
    case "flower":
      return (
        <G>
          {PETAL_ANGLES.map((angle) => (
            <Path
              key={angle}
              d="M12 12C9.6 9.4 9.6 5 12 2.6 14.4 5 14.4 9.4 12 12Z"
              fill={color}
              opacity={0.85}
              transform={`rotate(${angle} 12 12)`}
            />
          ))}
          <Circle cx={12} cy={12} r={2.4} fill="#ffffff" opacity={0.9} />
        </G>
      );
    case "petal":
      return <Path d="M12 21.5C6.5 18 5 11 8.2 3.5 10 5.2 14 5.2 15.8 3.5 19 11 17.5 18 12 21.5Z" fill={color} />;
    case "leaf":
      return (
        <G>
          <Path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" fill={color} />
          <Path d="M5.5 18.5 16 8" stroke="#000000" strokeOpacity={0.25} strokeWidth={1.2} strokeLinecap="round" />
        </G>
      );
    case "bubble":
      return (
        <G>
          <Circle cx={12} cy={12} r={9.5} fill={color} fillOpacity={0.14} stroke={color} strokeWidth={1.6} />
          <Path d="M7.5 9.5a5 5 0 0 1 3.5-3.4" stroke="#ffffff" strokeOpacity={0.8} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case "droplet":
      return <Path d="M12 2.5c3.5 4.6 6.5 8.4 6.5 12a6.5 6.5 0 0 1-13 0c0-3.6 3-7.4 6.5-12Z" fill={color} />;
  }
}

const ShapeField = memo(function ShapeField({
  sky,
  width,
  height,
  animated,
}: {
  sky: Sky;
  width: number;
  height: number;
  animated: boolean;
}) {
  // Tema değişince şekiller yeniden dağıtılır; ekran döndürülünce değil.
  const drifters = useMemo(() => createDrifters(sky.shapes), [sky.shapes]);
  return (
    <>
      {drifters.map((drifter, index) => (
        <DriftingShape
          key={`${drifter.shape}-${index}`}
          id={`tail-${index}`}
          drifter={drifter}
          color={sky.shapeColor}
          width={width}
          height={height}
          animated={animated}
        />
      ))}
    </>
  );
});

// ── Gökyüzü ───────────────────────────────────────────────────────────────

/** Hareket azaltma tercihi: açıksa yıldızlar sabit durur, şekiller hiç çizilmez. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduce(value);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}

/** Uygulama ön planda mı. Arka planda animasyon pil yakmasın. */
function useAppActive() {
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => subscription.remove();
  }, []);
  return active;
}

export function NightSky() {
  const { palette, sky } = useTheme();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const active = useAppActive();
  const animated = !reduceMotion && active;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]} importantForAccessibility="no-hide-descendants">
      {/* Renkli parıltı: web'deki iki bulanık radyal gradyan. */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <RadialGradient id="glow-a" cx="25%" cy="20%" rx="60%" ry="42%" fx="25%" fy="20%">
            <Stop offset="0" stopColor={sky.glowA} stopOpacity={0.38} />
            <Stop offset="1" stopColor={sky.glowA} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow-b" cx="75%" cy="80%" rx="55%" ry="42%" fx="75%" fy="80%">
            <Stop offset="0" stopColor={sky.glowB} stopOpacity={0.32} />
            <Stop offset="1" stopColor={sky.glowB} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#glow-a)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#glow-b)" />
      </Svg>

      {STAR_LAYERS.map((layer, index) => (
        <StarLayerView key={index} layer={layer} width={width} height={height} halo={sky.starHalo} animated={animated} />
      ))}

      {!reduceMotion && <ShapeField sky={sky} width={width} height={height} animated={animated} />}

      {/* Kenar karartması: merkez açık, kenarlar koyu — gökyüzü düz bir duvar
          değil, içine doğru derinleşen bir boşluk gibi dursun. */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="40%" rx="85%" ry="75%" fx="50%" fy="40%">
            <Stop offset="0.35" stopColor="#000000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.55} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#vignette)" />
      </Svg>
    </View>
  );
}
