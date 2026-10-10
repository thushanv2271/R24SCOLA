import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import RefreshControl from "../components/ui/AppRefreshControl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import ScolaMenu from "../components/ScolaMenu";
import ScreenHeader from "../components/blocks/ScreenHeader";
import LoaderModal from "../components/ui/LoaderModal";
import AlertModal from "../components/AlertModal";
import ScolaCoin from "../components/wallet/ScolaCoin";
import { useCountUp } from "../components/ui/motion";
import { AuthContext } from "../components/AuthContext";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { walletAPI } from "../services/apiService";

const formatUsd = (value) =>
  `$${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatRelativeDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const TRANSACTION_ICON = {
  signup_bonus: "gift",
  scholarship_request: "school",
  job_request: "briefcase",
  bulk_scholarship_request: "layers",
  bulk_job_request: "layers",
};

const TransactionRow = ({ item }) => {
  const { t } = useContext(LanguageContext);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const isCredit = item.type === "credit";
  return (
    <View style={styles.txRow}>
      <View
        style={[
          styles.txIconWrap,
          { backgroundColor: isCredit ? colors.successLight : colors.dangerLight },
        ]}
      >
        <Ionicons
          name={TRANSACTION_ICON[item.reason] || (isCredit ? "add-circle" : "remove-circle")}
          size={18}
          color={isCredit ? colors.success : colors.danger}
        />
      </View>
      <View style={styles.txTextWrap}>
        <Text style={styles.txTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.txDate}>{formatRelativeDate(item.createdAt)}</Text>
      </View>
      <View style={styles.txAmountWrap}>
        <Text style={[styles.txAmount, { color: isCredit ? colors.success : colors.danger }]}>
          {isCredit ? "+" : "-"}
          {item.amount}
        </Text>
        <Text style={styles.txBalance}>{item.balanceAfter} {t("wallet.coinsLeft")}</Text>
      </View>
    </View>
  );
};

// A detailed row instead of a bare icon+number chip — each cost now says
// in plain language what the coins actually pay for, so the balance means
// something rather than being an abstract number to spend blind.
const CostRow = ({ icon, label, description, cost, coinsLabel }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  return (
    <View style={styles.costRow}>
      <View style={styles.costIconWrap}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.costTextWrap}>
        <Text style={styles.costLabel}>{label}</Text>
        <Text style={styles.costDescription}>{description}</Text>
      </View>
      <View style={styles.costBadge}>
        <Text style={styles.costBadgeValue}>{cost}</Text>
        <Text style={styles.costBadgeUnit}>{coinsLabel}</Text>
      </View>
    </View>
  );
};

export default function WalletScreen() {
  const { user, wallet, refreshWallet } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [transactions, setTransactions] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [offlineAlertVisible, setOfflineAlertVisible] = useState(false);
  // `wallet` comes from AuthContext, fetched independently of this screen —
  // if that fetch fails (e.g. no connectivity before this screen ever
  // opened), `wallet` just silently stays null forever and this screen sat
  // on its loading spinner indefinitely with no way out. This gives it a
  // ceiling: after 8s with no wallet, show a retry state instead.
  const [walletTimedOut, setWalletTimedOut] = useState(false);

  useEffect(() => {
    if (wallet) {
      setWalletTimedOut(false);
      return undefined;
    }
    const timer = setTimeout(() => setWalletTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [wallet]);

  const loadTransactions = useCallback(async () => {
    if (!user?.username) return;
    try {
      const data = await walletAPI.getTransactions(user.username, 50);
      setTransactions(data?.transactions ?? []);
    } catch (error) {
      console.error("Error loading transaction history:", error);
      if (error?.isNetworkError) setOfflineAlertVisible(true);
      setTransactions([]);
    }
  }, [user?.username]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshWallet(), loadTransactions()]);
    setRefreshing(false);
  };

  const coins = wallet?.coins ?? 0;
  const shownCoins = useCountUp(coins);
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === "earned") return transactions.filter((tx) => tx.type === "credit");
    if (filter === "spent") return transactions.filter((tx) => tx.type !== "credit");
    return transactions;
  }, [transactions, filter]);
  const valueUsd = wallet?.valueUsd ?? 0;
  const coinValueUsd = wallet?.coinValueUsd ?? 5;
  const pricing = wallet?.pricing ?? {
    scholarshipRequest: 10,
    jobRequest: 20,
    bulkRequest: 50,
  };

  if (!wallet && walletTimedOut) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader onBack={() => router.back()} onMenuPress={() => setMenuVisible(true)} />
        <View style={styles.loadFailedState}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <Text style={styles.loadFailedTitle}>Couldn't load your wallet</Text>
          <Text style={styles.loadFailedText}>
            Please check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.85}
            onPress={() => {
              setWalletTimedOut(false);
              refreshWallet();
              loadTransactions();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      </SafeAreaView>
    );
  }

  if (!wallet || transactions === null) {
    return (
      <SafeAreaView style={styles.container}>
        <LoaderModal />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Same logo + icon-row header as Home/Favourites/Explore/Inbox/Profile
          — just with a back arrow added, since Wallet is pushed on top of
          the tabs rather than being one itself. The page name that used to
          live in the header's title slot (now replaced by the logo) moves
          into its own title row below, same as Inbox/Explore do. */}
      <ScreenHeader onBack={() => router.back()} onMenuPress={() => setMenuVisible(true)} />
      <Text style={styles.pageTitle}>{t("wallet.title")}</Text>
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => item.id || `${item.createdAt}-${index}`}
        renderItem={({ item }) => <TransactionRow item={item} />}
        ItemSeparatorComponent={() => <View style={styles.txDivider} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={isDark ? ["#0b1220", "#1b2540"] : ["#ffffff", "#fff1cf"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, !isDark && styles.heroLight]}
            >
              <View pointerEvents="none" style={styles.heroGlow} />
              <View style={styles.heroTop}>
                <View style={styles.heroBalanceCol}>
                  <Text style={styles.balanceLabel}>{t("wallet.totalBalance")}</Text>
                  <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
                    {shownCoins.toLocaleString()}
                  </Text>
                  <Text style={styles.balanceUnit}>{t("wallet.scolaCoins")}</Text>
                </View>
                <ScolaCoin size={84} spin />
              </View>
              <View style={styles.valuePill}>
                <Text style={styles.valuePillText} numberOfLines={1}>
                  ≈ {formatUsd(valueUsd)} · {formatUsd(coinValueUsd)} {t("wallet.perCoin")}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <Text style={styles.canSendLabel}>{t("wallet.canSend")}</Text>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{Math.floor(coins / pricing.scholarshipRequest)}</Text>
                  <Text style={styles.statLabel}>{t("wallet.statScholarships")}</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{Math.floor(coins / pricing.jobRequest)}</Text>
                  <Text style={styles.statLabel}>{t("wallet.statJobs")}</Text>
                </View>
              </View>
            </LinearGradient>

            <Text style={styles.sectionTitle}>{t("wallet.whatThingsCost")}</Text>
            <Text style={styles.sectionSubtitle}>{t("wallet.whatThingsCostSubtitle")}</Text>
            <View style={styles.costList}>
              <CostRow
                icon="school-outline"
                label={t("wallet.scholarship")}
                description={t("wallet.scholarshipDesc")}
                cost={pricing.scholarshipRequest}
                coinsLabel={t("wallet.coins")}
              />
              <CostRow
                icon="briefcase-outline"
                label={t("wallet.job")}
                description={t("wallet.jobDesc")}
                cost={pricing.jobRequest}
                coinsLabel={t("wallet.coins")}
              />
              <CostRow
                icon="layers-outline"
                label={t("wallet.requestAll")}
                description={t("wallet.requestAllDesc")}
                cost={pricing.bulkRequest}
                coinsLabel={t("wallet.coins")}
              />
            </View>

            <View style={styles.activityHeaderRow}>
              <Text style={styles.sectionTitle}>{t("wallet.recentActivity")}</Text>
              {transactions.length > 0 && (
                <Text style={styles.activityCount}>{filteredTransactions.length}</Text>
              )}
            </View>
            {transactions.length > 0 && (
              <View style={styles.filterRow}>
                {["all", "earned", "spent"].map((key) => {
                  const active = filter === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilter(key)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {t(`wallet.filter${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>{t("wallet.noActivityYet")}</Text>
          </View>
        }
      />
      <AlertModal
        visible={offlineAlertVisible}
        title="No Internet Connection"
        message="Please check your internet connection and try again."
        type="warning"
        onClose={() => setOfflineAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => {
  // Hero card palette: deep navy in dark mode, warm cream with dark text in light mode.
  const hero = isDark
    ? { glow: "rgba(251,191,36,0.16)", label: "rgba(255,255,255,0.65)", text: "#fff", unit: "#fbbf24", pill: "rgba(255,255,255,0.12)", pillText: "#fff", line: "rgba(255,255,255,0.18)", sub: "rgba(255,255,255,0.6)", statLabel: "rgba(255,255,255,0.7)", badgeBg: "rgba(251,191,36,0.16)", badgeValue: "#fde68a", badgeUnit: "#fbbf24" }
    : { glow: "rgba(251,191,36,0.32)", label: "#6b7280", text: "#0f172a", unit: "#b45309", pill: "rgba(180,83,9,0.10)", pillText: "#92400e", line: "rgba(15,23,42,0.10)", sub: "#6b7280", statLabel: "#475569", badgeBg: "#fff7e6", badgeValue: "#92400e", badgeUnit: "#b45309" };
  return StyleSheet.create({
  heroLight: {
    borderWidth: 1,
    borderColor: "#f3dfae",
    shadowColor: "#b45309",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: colors.textPrimary,
    marginTop: 14,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: hero.glow,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroBalanceCol: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: hero.label,
    fontFamily: "Roboto",
  },
  balanceValue: {
    fontSize: 44,
    fontWeight: "800",
    color: hero.text,
    fontFamily: "Roboto",
    marginTop: 2,
  },
  balanceUnit: {
    fontSize: 14,
    fontWeight: "700",
    color: hero.unit,
    fontFamily: "Roboto",
  },
  valuePill: {
    alignSelf: "flex-start",
    backgroundColor: hero.pill,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  valuePillText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: hero.pillText,
    fontFamily: "Roboto",
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: hero.line,
    marginTop: 18,
    marginBottom: 14,
  },
  canSendLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: hero.sub,
    fontFamily: "Roboto",
    marginBottom: 10,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCell: {
    flex: 1,
  },
  statSeparator: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: hero.line,
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: hero.text,
    fontFamily: "Roboto",
  },
  statLabel: {
    fontSize: 12,
    color: hero.statLabel,
    fontFamily: "Roboto",
    marginTop: 1,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: "Roboto",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
    marginTop: 22,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontFamily: "Roboto",
    marginTop: 3,
    marginBottom: 12,
  },
  costList: {
    gap: 10,
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  costIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  costTextWrap: {
    flex: 1,
  },
  costLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
  },
  costDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Roboto",
    marginTop: 2,
    lineHeight: 16,
  },
  costBadge: {
    alignItems: "center",
    backgroundColor: hero.badgeBg,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 54,
  },
  costBadgeValue: {
    fontSize: 15,
    fontWeight: "800",
    color: hero.badgeValue,
    fontFamily: "Roboto",
  },
  costBadgeUnit: {
    fontSize: 12,
    fontWeight: "600",
    color: hero.badgeUnit,
    fontFamily: "Roboto",
  },
  activityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  activityCount: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txTextWrap: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: "Roboto",
  },
  txDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
    marginTop: 2,
  },
  txAmountWrap: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "Roboto",
  },
  txBalance: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
    marginTop: 2,
  },
  txDivider: {
    height: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: "Roboto",
  },
  loadFailedState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  loadFailedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    fontFamily: "Roboto",
    marginTop: 4,
  },
  loadFailedText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: "Roboto",
    textAlign: "center",
    lineHeight: 19,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  });
};
