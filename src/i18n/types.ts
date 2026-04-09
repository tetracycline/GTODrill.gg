export type Language = 'zh-TW' | 'zh-CN' | 'en'

export interface Translations {
  nav: {
    gto_practice: string
    postflop: string
    mtt: string
    ai_coach: string
    review: string
    settings: string
  }
  sidebar: {
    rfi: string
    vs_rfi: string
    bvb: string
    vs_3bet: string
    vs_4bet: string
    cold_4bet: string
    postflop_cbet: string
    push_fold: string
    push_fold_chart: string
    weak_spots: string
    ai_qa: string
    admin: string
  }
  stats_bar: {
    total: string
    correct: string
    accuracy: string
    streak: string
  }
  quiz: {
    correct: string
    wrong: string
    next_hand: string
    reset_stats: string
    show_range: string
    hide_range: string
    accuracy: string
    hands_practiced: string
    position: string
    practice_position: string
    reset_confirm: string
    keyboard_shortcuts: string
    current_settings: string
    based_on_rfi: string
    raise_pct_footer: string
    gto_colon: string
    stack_depth: string
    your_hand: string
    board: string
    pot: string
    facing: string
    explanation: string
    source: string
    /** RFI 矩陣：對魚桌圖例標題 */
    range_legend_fish_title: string
    range_legend_fish_amber: string
    range_legend_fish_orange: string
    /** RFI 矩陣：對 Nit 圖例 */
    range_legend_nit_title: string
    range_legend_nit_dark: string
    range_legend_nit_orange: string
    /** RFI 結果：桌型與 GTO 不同時之說明 */
    rfi_explain_fish_adjust: string
    rfi_explain_nit_adjust: string
    /** `{action}` 為 GTO 動作短標籤 */
    rfi_explain_gto_answer: string
  }
  app: {
    open_menu: string
    close_menu: string
    training_modes_sidebar: string
    wrong_book: string
    settings_aria: string
  }
  auth: {
    guest_mode: string
    login_to_sync: string
    sign_out: string
    modal_close_aria: string
    modal_brand: string
    modal_save_title: string
    modal_save_subtitle: string
    modal_upgrade_title: string
    modal_upgrade_subtitle: string
    modal_supabase_hint_before: string
    modal_supabase_hint_after: string
    tab_login: string
    tab_signup: string
    google_sign_in: string
    divider_or_email: string
    label_email: string
    label_password: string
    submit_login: string
    submit_signup: string
    continue_free: string
    error_google_failed: string
    /** 側邊欄未登入時：儲存進度標語（與登入按鈕同列）。 */
    sidebar_promo_headline: string
    /** 側邊欄未登入時：同步裝置說明。 */
    sidebar_promo_sub: string
    /** 已登入：開啟 Gumroad 訂閱管理頁。 */
    manage_subscription: string
  }
  /** Pro 升級彈窗（Gumroad 等）。 */
  upgrade: {
    title: string
    lead: string
    feature_bvb_line: string
    feature_ai: string
    feature_weak_sync: string
    price: string
    cta: string
    dismiss: string
    /** 結帳須使用與本站相同 email（Gumroad Ping 自動對應 profiles）。 */
    checkout_email_hint: string
    /** 續訂由 Gumroad 扣款，每次成功付款會延長 Pro 到期日。 */
    auto_renew_hint: string
    /** 已登入：付款後手動重新載入訂閱狀態。 */
    refresh_status_cta: string
    /** 顯示目前登入信箱，方便與 Gumroad 結帳比對；`{email}` 為占位。 */
    refresh_account_email_fmt: string
    refresh_result_pro: string
    refresh_result_free: string
    refresh_result_no_profile: string
  }
  pages: {
    rfi_subtitle: string
    vsrfi_subtitle: string
    bvb_subtitle: string
    vs3_subtitle: string
    vs4_subtitle: string
    cold4_subtitle: string
    pushfold_subtitle: string
    pushfold_chart_subtitle: string
    chart_settings: string
    chart_stack_aria: string
    chart_position_row: string
    chart_push_line: string
    chart_hands_count: string
    chart_note: string
    chart_source: string
    quiz_settings: string
    scenario_settings: string
    training_mode: string
    pick_scenario: string
    bvb_bb_defend: string
    bvb_sb_vs: string
    facing: string
    opener_row: string
    hero_row_cold: string
    vs4_info: string
    vs4_gto_tip: string
    cold_ip_oop_note: string
    postflop_page_title: string
    postflop_subtitle: string
    postflop_card_title: string
    postflop_loading: string
    postflop_preflop_pill: string
    postflop_gto_badge: string
    postflop_ai_badge: string
    postflop_explain: string
    postflop_next_hint: string
    postflop_next_btn: string
    postflop_placeholder: string
    postflop_vs: string
    weakspots_subtitle: string
    weakspots_empty: string
    weakspots_review: string
    weakspots_expand: string
    weakspots_collapse: string
    weakspots_leaks_fmt: string
    weakspots_spot_question_fmt: string
    weakspots_spot_hand_fmt: string
    wrongbook_title: string
    wrongbook_copy: string
    wrongbook_clear: string
    wrongbook_hint: string
    wrongbook_empty: string
    wrongbook_close: string
    wrongbook_toast_none: string
    wrongbook_toast_copied_fmt: string
    wrongbook_toast_fail: string
    wrongbook_confirm_clear: string
    wrongbook_toast_cleared: string
    /** 錯題本／弱點：模式顯示名 */
    mode_display_rfi: string
    mode_display_vsrfi: string
    mode_display_bvb: string
    mode_display_vs3bet: string
    mode_display_vs4bet: string
    mode_display_cold4bet: string
    mode_display_pushfold: string
    mode_display_postflop_cbet: string
    wrongbook_you_colon: string
    wrongbook_gto_colon: string
    /** RFI 錯題：依桌型判定之正解前綴 */
    wrongbook_table_expected_colon: string
    /** RFI 錯題：純 solver 線前綴 */
    wrongbook_pure_gto_colon: string
    wrongbook_vsrfi_ctx: string
    wrongbook_spot_bb_defend: string
    wrongbook_spot_sb_vs_3bet: string
    wrongbook_vs3_ctx: string
    combo_settings: string
    villain_open: string
    hero_position: string
    shortcut_overlay_title: string
    shortcut_col_general: string
    shortcut_col_mode: string
    gto_push: string
    gto_fold: string
    based_stack_pos: string
    bvb_continue_fmt: string
    bvb_fourbet_stat_fmt: string
    bvb_sb_open: string
    bvb_bb_hero: string
    bvb_sb_hero: string
    bvb_bb_3bet: string
    opening_position_settings: string
    vs3_footer_fmt: string
    vs3_fourbet_pct_fmt: string
    vs4_footer_depth: string
    vs4_call_pct_fmt: string
    cold_settings_title: string
    cold_footer_left: string
    push_stat_pct_fmt: string
    /** AI 教練頁 */
    ai_chat_welcome: string
    ai_chat_placeholder: string
    ai_chat_clear: string
    ai_chat_enter_hint: string
    ai_chat_quota_fmt: string
    ai_chat_fetch_https: string
    ai_chat_fetch_invalid: string
    ai_chat_fetch_private: string
    ai_chat_fetch_timeout: string
    ai_chat_fetch_failed: string
    ai_chat_unavailable: string
    ai_chat_quick_preflop_label: string
    ai_chat_quick_preflop_text: string
    ai_chat_quick_hand_label: string
    ai_chat_quick_hand_text: string
    ai_chat_quick_paste_label: string
    ai_chat_quick_paste_text: string
    ai_chat_quick_gto_label: string
    ai_chat_quick_gto_text: string
    ai_chat_quick_url_label: string
    ai_chat_quick_url_text: string
    ai_chat_quick_spot_label: string
    ai_chat_quick_spot_text: string
  }
  actions: {
    raise: string
    fold: string
    call: string
    three_bet: string
    four_bet: string
    push: string
    check: string
    bet_small: string
    bet_large: string
    check_raise: string
    probe: string
  }
  daily: {
    today_practice: string
    accuracy: string
    target: string
    hands_unit: string
  }
  /** 對手 HUD／剝削建議浮動面板 */
  opponent_profile: {
    toggle_btn: string
    title: string
    optional: string
    vpip: string
    pfr: string
    threebet: string
    fold_to_cbet: string
    analyze: string
    clear: string
    presets: string
    fish: string
    reg: string
    shark: string
    nit: string
    adjustments: string
    no_adjustments: string
    hint_before_analyze: string
    severity_high: string
    severity_medium: string
    severity_low: string
  }
  /** 全域桌型（測驗預期答案） */
  opponent_type: {
    label: string
    gto: string
    fish: string
    nit: string
    aggro: string
    reg: string
    /** 徽章：Playing vs … */
    playing_vs: string
    /**
     * 翻後覆寫說明；`{type}` `{answer}` `{gto_answer}` 為占位。
     */
    override_note: string
    /** RFI 結果：依桌型預期動作前綴 */
    expected_colon: string
    /** RFI 結果：與純 GTO 不同時顯示 */
    solver_gto_colon: string
  }
  settings: {
    title: string
    language: string
    theme: string
    daily_target: string
    dark_mode: string
    light_mode: string
    preferences: string
    rake_dialog_title: string
    rake_close: string
    rake_sec1_title: string
    rake_sec1_p1: string
    rake_sec1_p2: string
    rake_sec2_title: string
    rake_sec2_p1: string
    rake_sec2_p2: string
    rake_sec2_p3: string
    rake_sec3_title: string
    rake_sec3_li1: string
    rake_sec3_li2: string
    rake_sec3_li3: string
    rake_sec3_li4: string
    rake_source_label: string
    rake_source_quote: string
    bug_report_title: string
    bug_report_desc: string
    bug_report_placeholder: string
    bug_report_submit: string
    bug_report_submitting: string
    bug_report_success: string
    bug_report_error: string
    bug_report_privacy: string
  }
}
