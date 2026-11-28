import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import type { Cycle, DailyLog } from "@/core";
import * as store from "./db";
import type { DailyLogInput } from "./rules";
import { getToday } from "./today";

/**
 * Veri hook'ları.
 *
 * Ana ekran, takvim, doğurganlık ve istatistik aynı tek okumadan beslenir
 * (döngüler + günlükler, telefondaki SQLite'tan). Hesapların hepsi `@/core`
 * ile yapılır. Yazma işlemlerinden sonra bu tek sorgu tazelenir, böylece bütün
 * ekranlar aynı veriyi gösterir.
 */

export const CYCLE_DATA_KEY = ["dongu"] as const;

export function useCycleData() {
  return useQuery({ queryKey: CYCLE_DATA_KEY, queryFn: store.loadCycleData });
}

/**
 * Bugünün tarihi (telefonun saat dilimine göre). Uygulama arka plandan dönünce ve her
 * dakika yeniden hesaplanır — gece yarısı açık kalan ekran dünü göstermesin.
 */
export function useToday(): string {
  const [today, setToday] = useState(getToday);
  useEffect(() => {
    const refresh = () => setToday(getToday());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    const timer = setInterval(refresh, 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);
  return today;
}

function useInvalidatingMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>, extraKeys: string[] = []) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CYCLE_DATA_KEY }),
        ...extraKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
      ]);
    },
  });
}

export function useStartPeriod() {
  return useInvalidatingMutation((date: string) => store.startPeriod(date));
}

export function useEndPeriod() {
  return useInvalidatingMutation((args: { date: string; cycleId?: string }) =>
    store.endPeriod(args.date, args.cycleId),
  );
}

export function useClearPeriodEnd() {
  return useInvalidatingMutation((cycleId: string) => store.clearPeriodEnd(cycleId));
}

export function useDeleteCycle() {
  return useInvalidatingMutation((cycleId: string) => store.deleteCycle(cycleId));
}

export function useDeleteAllRecords() {
  return useInvalidatingMutation(() => store.deleteAllRecords(), ["gun"]);
}

/** Yedekten geri yükleme; bütün ekranlar yeni kayıtlarla yenilenir. */
export function useRestoreBackup() {
  return useInvalidatingMutation(
    (data: { cycles: Cycle[]; logs: DailyLog[] }) => store.replaceAllRecords(data.cycles, data.logs),
    ["gun"],
  );
}

export function useDailyLog(date: string) {
  return useQuery({ queryKey: ["gun", date], queryFn: () => store.getDailyLog(date) });
}

export function useSaveDailyLog(date: string) {
  return useInvalidatingMutation((input: DailyLogInput) => store.saveDailyLog(date, input), ["gun"]);
}
