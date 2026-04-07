import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type SetStateAction,
} from 'react'
import { HandCard } from './components/HandCard/HandCard'
import { PushFoldChartPage } from './components/PushFoldChartPage/PushFoldChartPage'
import { PushFoldPage } from './components/PushFoldPage/PushFoldPage'
import { RangePanel } from './components/RangePanel/RangePanel'
import { GameSettings } from './components/GameSettings/GameSettings'
import { WrongBookPanel } from './components/WrongBookPanel/WrongBookPanel'
import { SettingsCard } from './components/SettingsCard/SettingsCard'
import { ShortcutOverlay } from './components/ShortcutOverlay/ShortcutOverlay'
import { StatsBar } from './components/StatsBar/StatsBar'
import { BvBPage } from './components/BvBPage/BvBPage'
import { Vs3betPage } from './components/Vs3betPage/Vs3betPage'
import { Vs4betPage } from './components/Vs4betPage/Vs4betPage'
import { VsRFIPage } from './components/VsRFIPage/VsRFIPage'
import { PostflopPage } from './components/PostflopPage/PostflopPage'
import { Cold4betPage } from './components/Cold4betPage/Cold4betPage'
import { WeakSpotsPage } from './components/WeakSpotsPage/WeakSpotsPage'
import { DailyProgress } from './components/DailyProgress/DailyProgress'
import { HandHistoryPage } from './components/HandHistoryPage/HandHistoryPage'
import { AIChatPage } from './components/AIChatPage/AIChatPage'
import { AdminPage } from './components/AdminPage/AdminPage'
import {
  AuthModal,
  type AuthModalReason,
} from './components/AuthModal/AuthModal'
import { UpgradeModal } from './components/UpgradeModal/UpgradeModal'
import { FREE_POSTFLOP_ANSWERS_PER_DAY, isProOnlyMode } from './config/freemium'
import { useAuth } from './contexts/AuthContext'
import { useKeyboard } from './hooks/useKeyboard'
import { usePushFoldQuiz } from './hooks/usePushFoldQuiz'
import type { QuizIntegrationOptions } from './hooks/quizIntegration'
import type { QuizStats } from './hooks/useQuiz'
import { useQuiz } from './hooks/useQuiz'
import { useBvBQuiz } from './hooks/useBvBQuiz'
import { useVs3betQuiz } from './hooks/useVs3betQuiz'
import { useVs4betQuiz } from './hooks/useVs4betQuiz'
import { useVsRFIQuiz } from './hooks/useVsRFIQuiz'
import { usePostflopQuiz } from './hooks/usePostflopQuiz'
import { useCold4betQuiz } from './hooks/useCold4betQuiz'
import { useWeakSpots } from './hooks/useWeakSpots'
import { useDailyProgress } from './hooks/useDailyProgress'
import type { MatrixFlash } from './components/RangeMatrix/RangeMatrix'
import { debugRangeSize } from './utils/ranges'
import { loadWrongQuizEntries, WRONG_BOOK_EVENT } from './utils/wrongBook'
import { WEAK_SPOT_TRACKED_MODES } from './utils/weakSpots'
import { useTranslation } from './i18n/LanguageContext'
import styles from './App.module.css'

export type TrainerMode =
  | 'rfi'
  | 'vsrfi'
  | 'bvb'
  | 'vs3bet'
  | 'vs4bet'
  | 'cold4bet'
  | 'pushfold'
  | 'pushfoldchart'
  | 'postflop-cbet'
  | 'ai-coach'
  | 'weakspots'
  | 'hand-history'
  | 'admin'

const EMPTY_STATS: QuizStats = { total: 0, correct: 0, streak: 0 }

/**
 * 側邊欄頭像沒有圖片時的縮寫字元。
 *
 * @param displayName - 顯示名稱。
 * @param email - 後備 Email。
 */
function sidebarInitials(displayName: string, email: string): string {
  const s = displayName.trim() || email.trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase()
  return s.slice(0, 2).toUpperCase()
}

interface RfiTrainingViewProps {
  quiz: ReturnType<typeof useQuiz>
}

/**
 * RFI 訓練畫面。
 */
function RfiTrainingView({ quiz }: RfiTrainingViewProps) {
  const { t } = useTranslation()
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [matrixFlash, setMatrixFlash] = useState<MatrixFlash>(null)

  const {
    currentPosition,
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    selectPosition,
    resetStats,
  } = quiz

  useEffect(() => {
    if (phase !== 'result' || lastCorrect === null) {
      setMatrixFlash(null)
      return
    }
    setMatrixFlash(lastCorrect ? 'correct' : 'wrong')
    const t = window.setTimeout(() => setMatrixFlash(null), 300)
    return () => clearTimeout(t)
  }, [phase, lastCorrect, currentHandIdx])

  const toggleShortcutOverlay = useCallback(() => setShortcutOpen((o) => !o), [])
  const closeShortcutOverlay = useCallback(() => setShortcutOpen(false), [])

  const onRaise = useCallback(() => answer('raise'), [answer])
  const onFold = useCallback(() => answer('fold'), [answer])

  useKeyboard({
    mode: 'rfi',
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand: nextHand,
    onToggleShowRange: () => setShowRange((s) => !s),
    onResetStats: resetStats,
    onRfiRaise: onRaise,
    onRfiFold: onFold,
    onRfiTogglePosition: selectPosition,
  })

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sidebar.rfi}</h1>
        <p className={styles.subtitle}>{t.pages.rfi_subtitle}</p>
      </header>

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <StatsBar total={stats.total} correct={stats.correct} streak={stats.streak} />
          <SettingsCard
            selectedPosition={currentPosition}
            onSelectPosition={selectPosition}
            onOpenShortcuts={() => setShortcutOpen(true)}
            onResetStats={resetStats}
          />
          <HandCard
            positionLabel={currentPosition}
            handIdx={currentHandIdx}
            combo={currentCombo}
            phase={phase}
            lastCorrect={lastCorrect}
            onRaise={onRaise}
            onFold={onFold}
          />
        </div>
        <div className={styles.colRight}>
          <RangePanel
            showRange={showRange}
            onToggleShowRange={() => setShowRange((s) => !s)}
            matrixPosition={currentPosition}
            highlightHandIdx={currentHandIdx}
            matrixFlash={matrixFlash}
          />
        </div>
      </main>

      <ShortcutOverlay open={shortcutOpen} onClose={closeShortcutOverlay} mode="rfi" />
    </>
  )
}

/**
 * 建立測驗整合選項（弱點複習、間隔抽弱點）。
 */
function buildQuizIntegration(
  modeId: string,
  weakReviewMode: string | null,
  recordResult: ReturnType<typeof useWeakSpots>['recordResult'],
  recordAnswer: ReturnType<typeof useDailyProgress>['recordAnswer'],
  pickWeakHand: ReturnType<typeof useWeakSpots>['pickWeakHandForMode'],
  pickWeakQuestionId: ReturnType<typeof useWeakSpots>['pickWeakQuestionIdForMode'],
): QuizIntegrationOptions {
  return {
    onRecordResult: (mode, position, correct, meta) => {
      recordResult(mode, position, correct, meta?.handIdx, meta?.questionId)
    },
    onDailyAnswer: recordAnswer,
    pickWeakHand,
    pickWeakQuestionId,
    weakReviewOnly: weakReviewMode === modeId,
  }
}

/**
 * 根元件：側邊欄切換模式；各測驗統計分開保存。
 */
function App() {
  const { t, lang, setLang } = useTranslation()
  const { user, isLoggedIn, isAdmin, isPro, profile, signOut } = useAuth()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalReason, setAuthModalReason] = useState<AuthModalReason>('save-progress')
  const hasProAccess = isPro || isAdmin

  const openAuthModal = useCallback((reason: AuthModalReason) => {
    setAuthModalReason(reason)
    setAuthModalOpen(true)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
  }, [signOut])

  useLayoutEffect(() => {
    const th = localStorage.getItem('gto-theme') === 'light' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', th)
  }, [])

  const modeTitle = useMemo(
    () =>
      ({
        rfi: t.sidebar.rfi,
        vsrfi: t.sidebar.vs_rfi,
        bvb: t.sidebar.bvb,
        vs3bet: t.sidebar.vs_3bet,
        vs4bet: t.sidebar.vs_4bet,
        cold4bet: t.sidebar.cold_4bet,
        pushfold: t.sidebar.push_fold,
        pushfoldchart: t.sidebar.push_fold_chart,
        'postflop-cbet': t.sidebar.postflop_cbet,
        'ai-coach': t.sidebar.ai_qa,
        weakspots: t.sidebar.weak_spots,
        'hand-history': t.sidebar.hand_history,
        admin: t.sidebar.admin,
      }) satisfies Record<TrainerMode, string>,
    [t],
  )

  const [mode, setMode] = useState<TrainerMode>('rfi')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [gameSettingsOpen, setGameSettingsOpen] = useState(false)
  const [wrongBookOpen, setWrongBookOpen] = useState(false)
  const [wrongBookCount, setWrongBookCount] = useState(0)
  const [weakReviewMode, setWeakReviewMode] = useState<string | null>(null)

  const { recordResult, pickWeakHandForMode, pickWeakQuestionIdForMode, spots } = useWeakSpots()
  const { progress, recordAnswer, accuracy, pct, target, setTarget } = useDailyProgress()

  const goMode = useCallback((m: TrainerMode) => {
    setMode(m)
    setWeakReviewMode(null)
    setMobileNavOpen(false)
  }, [])

  const requestMode = useCallback(
    (m: TrainerMode) => {
      if (m === 'admin') {
        if (!isAdmin) return
        goMode('admin')
        return
      }
      if (isProOnlyMode(m) && !hasProAccess) {
        if (!isLoggedIn) {
          openAuthModal('upgrade-pro')
          return
        }
        setUpgradeOpen(true)
        return
      }
      goMode(m)
    },
    [goMode, hasProAccess, isAdmin, isLoggedIn, openAuthModal],
  )

  const startWeakReview = useCallback(
    (m: (typeof WEAK_SPOT_TRACKED_MODES)[number]) => {
      if (isProOnlyMode(m as TrainerMode) && !hasProAccess) {
        if (!isLoggedIn) {
          openAuthModal('upgrade-pro')
          return
        }
        setUpgradeOpen(true)
        return
      }
      setWeakReviewMode(m)
      setMode(m as TrainerMode)
      setMobileNavOpen(false)
    },
    [hasProAccess, isLoggedIn, openAuthModal],
  )

  const [statsByMode, setStatsByMode] = useState({
    rfi: { ...EMPTY_STATS },
    vsrfi: { ...EMPTY_STATS },
    bvb: { ...EMPTY_STATS },
    vs3bet: { ...EMPTY_STATS },
    vs4bet: { ...EMPTY_STATS },
    cold4bet: { ...EMPTY_STATS },
    pushfold: { ...EMPTY_STATS },
    'postflop-cbet': { ...EMPTY_STATS },
  })

  const setStats =
    <K extends keyof typeof statsByMode>(key: K) =>
    (u: SetStateAction<QuizStats>) => {
      setStatsByMode((prev) => ({
        ...prev,
        [key]: typeof u === 'function' ? u(prev[key]) : u,
      }))
    }

  const intRfi = useMemo(
    () =>
      buildQuizIntegration(
        'rfi',
        weakReviewMode,
        recordResult,
        recordAnswer,
        pickWeakHandForMode,
        pickWeakQuestionIdForMode,
      ),
    [weakReviewMode, recordResult, recordAnswer, pickWeakHandForMode, pickWeakQuestionIdForMode],
  )
  const intVsrfi = useMemo(
    () =>
      buildQuizIntegration(
        'vsrfi',
        weakReviewMode,
        recordResult,
        recordAnswer,
        pickWeakHandForMode,
        pickWeakQuestionIdForMode,
      ),
    [weakReviewMode, recordResult, recordAnswer, pickWeakHandForMode, pickWeakQuestionIdForMode],
  )
  const intBvb = useMemo(
    () =>
      buildQuizIntegration(
        'bvb',
        weakReviewMode,
        recordResult,
        recordAnswer,
        pickWeakHandForMode,
        pickWeakQuestionIdForMode,
      ),
    [weakReviewMode, recordResult, recordAnswer, pickWeakHandForMode, pickWeakQuestionIdForMode],
  )
  const intVs3 = useMemo(
    () =>
      buildQuizIntegration(
        'vs3bet',
        weakReviewMode,
        recordResult,
        recordAnswer,
        pickWeakHandForMode,
        pickWeakQuestionIdForMode,
      ),
    [weakReviewMode, recordResult, recordAnswer, pickWeakHandForMode, pickWeakQuestionIdForMode],
  )
  const intVs4 = useMemo(
    () =>
      buildQuizIntegration(
        'vs4bet',
        weakReviewMode,
        recordResult,
        recordAnswer,
        pickWeakHandForMode,
        pickWeakQuestionIdForMode,
      ),
    [weakReviewMode, recordResult, recordAnswer, pickWeakHandForMode, pickWeakQuestionIdForMode],
  )
  const intCold = useMemo(
    () =>
      buildQuizIntegration(
        'cold4bet',
        weakReviewMode,
        recordResult,
        recordAnswer,
        pickWeakHandForMode,
        pickWeakQuestionIdForMode,
      ),
    [weakReviewMode, recordResult, recordAnswer, pickWeakHandForMode, pickWeakQuestionIdForMode],
  )
  const intPush = useMemo(
    () =>
      buildQuizIntegration(
        'pushfold',
        weakReviewMode,
        recordResult,
        recordAnswer,
        pickWeakHandForMode,
        pickWeakQuestionIdForMode,
      ),
    [weakReviewMode, recordResult, recordAnswer, pickWeakHandForMode, pickWeakQuestionIdForMode],
  )
  const intPf = useMemo(() => {
    const base = buildQuizIntegration(
      'postflop-cbet',
      weakReviewMode,
      recordResult,
      recordAnswer,
      pickWeakHandForMode,
      pickWeakQuestionIdForMode,
    )
    return {
      ...base,
      allowAnswer: (modeId: string) =>
        modeId !== 'postflop-cbet' ||
        hasProAccess ||
        (progress.byMode['postflop-cbet']?.total ?? 0) < FREE_POSTFLOP_ANSWERS_PER_DAY,
      onAnswerDenied: () => setUpgradeOpen(true),
    }
  }, [
    weakReviewMode,
    recordResult,
    recordAnswer,
    pickWeakHandForMode,
    pickWeakQuestionIdForMode,
    hasProAccess,
    progress.byMode,
  ])

  const rfiQuiz = useQuiz(statsByMode.rfi, setStats('rfi'), intRfi)
  const vsQuiz = useVsRFIQuiz(statsByMode.vsrfi, setStats('vsrfi'), intVsrfi)
  const bvbQuiz = useBvBQuiz(statsByMode.bvb, setStats('bvb'), intBvb)
  const vs3Quiz = useVs3betQuiz(statsByMode.vs3bet, setStats('vs3bet'), intVs3)
  const vs4Quiz = useVs4betQuiz(statsByMode.vs4bet, setStats('vs4bet'), intVs4)
  const coldQuiz = useCold4betQuiz(statsByMode.cold4bet, setStats('cold4bet'), intCold)
  const pushQuiz = usePushFoldQuiz(statsByMode.pushfold, setStats('pushfold'), intPush)
  const postflopQuiz = usePostflopQuiz(statsByMode['postflop-cbet'], setStats('postflop-cbet'), intPf)

  useEffect(() => {
    debugRangeSize()
  }, [])

  useEffect(() => {
    const sync = () => setWrongBookCount(loadWrongQuizEntries().length)
    sync()
    window.addEventListener(WRONG_BOOK_EVENT, sync)
    return () => window.removeEventListener(WRONG_BOOK_EVENT, sync)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)')
    const onWide = () => {
      if (mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener('change', onWide)
    return () => mq.removeEventListener('change', onWide)
  }, [])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileNavOpen])

  useEffect(() => {
    if (!mobileNavOpen) return
    const mq = window.matchMedia('(max-width: 768px)')
    if (!mq.matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  const displayName = user
    ? profile?.display_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split('@')[0] ||
      'User'
    : ''
  const emailLine = user ? (profile?.email ?? user.email ?? '') : ''
  const initials = user ? sidebarInitials(displayName, emailLine) : ''

  const renderMain = () => {
    switch (mode) {
      case 'rfi':
        return <RfiTrainingView quiz={rfiQuiz} />
      case 'vsrfi':
        return <VsRFIPage quiz={vsQuiz} />
      case 'bvb':
        return <BvBPage quiz={bvbQuiz} />
      case 'vs3bet':
        return <Vs3betPage quiz={vs3Quiz} />
      case 'vs4bet':
        return <Vs4betPage quiz={vs4Quiz} />
      case 'cold4bet':
        return <Cold4betPage quiz={coldQuiz} />
      case 'pushfold':
        return <PushFoldPage quiz={pushQuiz} />
      case 'pushfoldchart':
        return <PushFoldChartPage />
      case 'postflop-cbet':
        return <PostflopPage quiz={postflopQuiz} />
      case 'ai-coach':
        return (
          <AIChatPage
            isUnlimited={hasProAccess}
            onFreeLimitReached={() => setUpgradeOpen(true)}
          />
        )
      case 'admin':
        return <AdminPage onBack={() => goMode('rfi')} />
      case 'weakspots':
        return (
          <WeakSpotsPage
            spots={spots}
            progressByMode={progress.byMode}
            onStartReview={startWeakReview}
          />
        )
      case 'hand-history':
        return <HandHistoryPage />
      default:
        return null
    }
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.mobileHeader}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setMobileNavOpen(true)}
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
          aria-label={t.app.open_menu}
        >
          ☰
        </button>
        <span className={styles.mobileTitle}>{modeTitle[mode]}</span>
        <div className={styles.mobileHeaderUser}>
          {user ? (
            <div className={styles.userCardCompact}>
              <div className={styles.userRowCompact}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className={styles.userAvatarImgSm}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={styles.userAvatarFallbackSm} aria-hidden>
                    {initials}
                  </span>
                )}
                <div className={styles.userCompactText}>
                  <p className={styles.userNameSm}>{displayName}</p>
                  <button
                    type="button"
                    className={styles.userSignOutSm}
                    onClick={() => void handleSignOut()}
                  >
                    {t.auth.sign_out}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.mobileLoginBtn}
              onClick={() => openAuthModal('save-progress')}
            >
              {t.auth.tab_login}
            </button>
          )}
        </div>
      </header>
      {mobileNavOpen ? (
        <button
          type="button"
          className={styles.navBackdrop}
          aria-label={t.app.close_menu}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <aside
        id="app-sidebar"
        className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''}`}
        aria-label={t.app.training_modes_sidebar}
      >
        <div className={styles.navSectionLabel}>{t.nav.gto_practice}</div>
        <nav className={styles.navList}>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'rfi' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('rfi')}
          >
            {t.sidebar.rfi}
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'vsrfi' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('vsrfi')}
          >
            {t.sidebar.vs_rfi}
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'bvb' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('bvb')}
          >
            {t.sidebar.bvb}
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'vs3bet' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('vs3bet')}
          >
            {t.sidebar.vs_3bet}
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'vs4bet' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('vs4bet')}
          >
            {t.sidebar.vs_4bet}
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'cold4bet' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('cold4bet')}
          >
            {t.sidebar.cold_4bet}
          </button>
        </nav>

        <div className={styles.navSectionLabel}>{t.nav.postflop}</div>
        <nav className={styles.navList}>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'postflop-cbet' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('postflop-cbet')}
          >
            {t.sidebar.postflop_cbet}
          </button>
        </nav>

        <div className={styles.navSectionLabel}>{t.nav.mtt}</div>
        <nav className={styles.navList}>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'pushfold' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('pushfold')}
          >
            {t.sidebar.push_fold}
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'pushfoldchart' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('pushfoldchart')}
          >
            {t.sidebar.push_fold_chart}
          </button>
        </nav>

        <div className={styles.navSectionLabel}>{t.nav.ai_coach}</div>
        <nav className={styles.navList}>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'ai-coach' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('ai-coach')}
          >
            {t.sidebar.ai_qa}
          </button>
        </nav>

        <div className={styles.navSectionLabel}>{t.nav.review}</div>
        <nav className={styles.navList}>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'weakspots' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('weakspots')}
          >
            {t.sidebar.weak_spots}
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${mode === 'hand-history' ? styles.navItemActive : ''}`}
            onClick={() => requestMode('hand-history')}
          >
            {t.sidebar.hand_history}
          </button>
        </nav>

        {isAdmin ? (
          <nav className={styles.navList} aria-label={t.sidebar.admin}>
            <button
              type="button"
              className={`${styles.navItem} ${mode === 'admin' ? styles.navItemActive : ''}`}
              onClick={() => requestMode('admin')}
            >
              {t.sidebar.admin}
            </button>
          </nav>
        ) : null}

        <div className={styles.sidebarFooter}>
          <DailyProgress progress={progress} accuracy={accuracy} pct={pct} target={target} />
          <div className={styles.langRow}>
            <button
              type="button"
              className={`${styles.langChip} ${lang === 'zh-TW' ? styles.langChipActive : ''}`}
              onClick={() => setLang('zh-TW')}
            >
              繁中
            </button>
            <button
              type="button"
              className={`${styles.langChip} ${lang === 'zh-CN' ? styles.langChipActive : ''}`}
              onClick={() => setLang('zh-CN')}
            >
              简中
            </button>
            <button
              type="button"
              className={`${styles.langChip} ${lang === 'en' ? styles.langChipActive : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
          <button
            type="button"
            className={styles.sidebarWrongBookBtn}
            onClick={() => {
              setMobileNavOpen(false)
              setWrongBookOpen(true)
            }}
            aria-label={`${t.app.wrong_book}${wrongBookCount > 0 ? ` ${wrongBookCount}` : ''}`}
          >
            {t.app.wrong_book}
            {wrongBookCount > 0 ? ` ${wrongBookCount}` : ''}
          </button>
          <button
            type="button"
            className={styles.sidebarGearBtn}
            onClick={() => {
              setMobileNavOpen(false)
              setGameSettingsOpen(true)
            }}
            aria-label={t.app.settings_aria}
          >
            ⚙
          </button>
        </div>
      </aside>
      <div className={styles.mainColumn}>
        <div className={styles.desktopTopBar}>
          <div className={styles.userCard}>
            {user ? (
              <div className={styles.userRow}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className={styles.userAvatarImg}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={styles.userAvatarFallback} aria-hidden>
                    {initials}
                  </span>
                )}
                <div>
                  <p className={styles.userName}>{displayName}</p>
                  {emailLine ? <p className={styles.userEmail}>{emailLine}</p> : null}
                  <button
                    type="button"
                    className={styles.userSignOut}
                    onClick={() => void handleSignOut()}
                  >
                    {t.auth.sign_out}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.loginPromoRow}>
                  <button
                    type="button"
                    className={styles.loginPromoBtn}
                    onClick={() => openAuthModal('save-progress')}
                  >
                    {t.auth.tab_login}
                  </button>
                  <p className={styles.loginPromoHeadline}>{t.auth.sidebar_promo_headline}</p>
                </div>
                <p className={styles.loginPromoSub}>{t.auth.sidebar_promo_sub}</p>
              </>
            )}
          </div>
        </div>
        {renderMain()}
      </div>
      <GameSettings
        open={gameSettingsOpen}
        onClose={() => setGameSettingsOpen(false)}
        dailyTarget={target}
        onDailyTargetChange={setTarget}
      />
      <WrongBookPanel open={wrongBookOpen} onClose={() => setWrongBookOpen(false)} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        reason={authModalReason}
      />
      {upgradeOpen ? <UpgradeModal onClose={() => setUpgradeOpen(false)} /> : null}
    </div>
  )
}

export default App
