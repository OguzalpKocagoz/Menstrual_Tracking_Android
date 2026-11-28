import { useMemo } from "react";
import { Text, View } from "react-native";
import { buildCycleOverview, computePredictionAccuracy, getPredictionWindow, RECENT_CYCLE_SAMPLE_SIZE } from "@/core";
import { Body, Card, Heading, Loading, Screen } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useCycleData, useToday } from "@/lib/data";
import { useTheme } from "@/lib/theme";

/**
 * "Tahmin nasıl hesaplanıyor?" — yöntem, kullanıcının kendi verisi, geçmiş
 * isabet, sınırlar ve kaynaklar.
 *
 * Amaç şeffaflık: isabet iddiası yöntemiyle birlikte sunulur (App Store'un
 * sağlık uygulamalarından beklediği de bu) ve kullanıcı tahmine ne kadar
 * güvenebileceğini kendi verisiyle görür.
 */

/** Kaynakların künyeleri dilden bağımsızdır; çevrilmez. */
const SOURCES = [
  "Munro MG, Critchley HOD, Fraser IS, et al. The two FIGO systems for normal and abnormal uterine bleeding symptoms and classification of causes of abnormal uterine bleeding in the reproductive years: 2018 revisions. Int J Gynaecol Obstet. 2018;143(3):393–408.",
  "ACOG Committee Opinion No. 651: Menstruation in Girls and Adolescents: Using the Menstrual Cycle as a Vital Sign. Obstet Gynecol. 2015;126(6):e143–e146.",
  "Bull JR, Rowland SP, Scherwitzl EB, et al. Real-world menstrual cycle characteristics of more than 600,000 menstrual cycles. NPJ Digit Med. 2019;2:83.",
  "Wilcox AJ, Weinberg CR, Baird DD. Timing of sexual intercourse in relation to ovulation. N Engl J Med. 1995;333(23):1517–1521.",
];

/** Bir ondalık, dile göre ayraçla: "1,8" / "1.8". */
function formatNumber(value: number, locale: "tr" | "en"): string {
  const text = (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, "");
  return locale === "tr" ? text.replace(".", ",") : text;
}

function Row({ label, value }: { label: string; value: string }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: palette.textMuted, fontSize: 15, flexShrink: 1 }}>{label}</Text>
      <Text style={{ color: palette.text, fontSize: 15, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

export default function MethodScreen() {
  const { t, locale } = useI18n();
  const today = useToday();
  const { data, isLoading } = useCycleData();

  const view = useMemo(() => {
    if (!data) return null;
    const overview = buildCycleOverview(data.cycles, today);
    return {
      stats: overview.stats,
      window: overview.nextPeriod ? getPredictionWindow(overview.nextPeriod, overview.stats) : null,
      confidence: overview.nextPeriod?.confidence ?? null,
      accuracy: computePredictionAccuracy(data.cycles, RECENT_CYCLE_SAMPLE_SIZE),
    };
  }, [data, today]);

  if (isLoading || !view) return <Loading />;
  const { stats, window, confidence, accuracy } = view;
  const days = (n: number) => t.common.days(n);

  return (
    <Screen edges={[]}>
      <Card>
        <Heading>{t.method.methodTitle}</Heading>
        {t.method.steps.map((step, index) => (
          <Body key={index}>{`${index + 1}. ${step}`}</Body>
        ))}
      </Card>

      <Card>
        <Heading>{t.method.yourDataTitle}</Heading>
        {stats.usingDefaults ? (
          <Body muted>{t.method.noData}</Body>
        ) : (
          <>
            <Row label={t.method.cyclesUsed} value={String(stats.observedCycleCount)} />
            <Row label={t.method.median} value={days(stats.medianCycleLength)} />
            {stats.shortestCycleLength !== null && stats.longestCycleLength !== null && (
              <Row
                label={t.method.range}
                value={`${stats.shortestCycleLength}–${days(stats.longestCycleLength)}`}
              />
            )}
            <Row label={t.method.variation} value={`±${formatNumber(stats.cycleLengthVariation, locale)}`} />
          </>
        )}
        {confidence && window && (
          <Row label={t.method.confidence} value={`${t.labels.confidence[confidence]} (±${window.spreadDays})`} />
        )}
      </Card>

      <Card>
        <Heading>{t.method.accuracyTitle}</Heading>
        {accuracy.sampleCount >= 2 && accuracy.meanAbsoluteError !== null ? (
          <>
            <Body>{t.method.accuracyBody(accuracy.sampleCount, formatNumber(accuracy.meanAbsoluteError, locale))}</Body>
            {/* Yalnızca belirgin bir kayma varsa söylenir; yarım günlük fark gürültüdür. */}
            {accuracy.bias !== null && accuracy.bias >= 1 && (
              <Body muted>{t.method.biasLate(formatNumber(accuracy.bias, locale))}</Body>
            )}
            {accuracy.bias !== null && accuracy.bias <= -1 && (
              <Body muted>{t.method.biasEarly(formatNumber(-accuracy.bias, locale))}</Body>
            )}
          </>
        ) : (
          <Body muted>{t.method.accuracyNone}</Body>
        )}
      </Card>

      <Card>
        <Heading>{t.method.limitsTitle}</Heading>
        <Body>{t.method.limitsBody}</Body>
      </Card>

      <Card>
        <Heading>{t.method.thresholdsTitle}</Heading>
        <Body>{t.method.thresholdsBody}</Body>
      </Card>

      <Card>
        <Heading>{t.method.sourcesTitle}</Heading>
        {SOURCES.map((source) => (
          <Body key={source} muted>
            {source}
          </Body>
        ))}
      </Card>

      <Body muted>{t.disclaimer}</Body>
    </Screen>
  );
}
