package com.pocketmystic.app.data

object DefaultDecks {

    private fun createTarotCardSvg(
        numberStr: String,
        title: String,
        primarySymbol: String,
        accentColor: String = "#c5a059"
    ): String {
        return """
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 520" width="100%" height="100%">
          <rect width="320" height="520" rx="14" fill="#121212" />
          <rect x="10" y="10" width="300" height="500" rx="10" fill="none" stroke="$accentColor" stroke-width="1.2" opacity="0.5" />
          <text x="160" y="52" fill="$accentColor" font-family="serif" font-size="16" font-weight="700" text-anchor="middle">$numberStr</text>
          <text x="160" y="258" font-family="serif" font-size="78" text-anchor="middle" fill="$accentColor">$primarySymbol</text>
          <text x="160" y="458" fill="#f4ede0" font-family="serif" font-size="15" font-weight="600" text-anchor="middle">${title.uppercase()}</text>
        </svg>
        """.trimIndent()
    }

    val TAROT_MAJOR_ARCANA = listOf(
        AppCard(0, "The Fool", createTarotCardSvg("0", "The Fool", "☼", "#e6a147"), listOf("Beginnings", "Innocence"), "A fresh new journey.", "Recklessness.", "Air", "☼", "tarot", true),
        AppCard(1, "The Magician", createTarotCardSvg("I", "The Magician", "∞", "#d4af37"), listOf("Manifestation", "Power"), "Tools ready.", "Manipulation.", "Air", "∞", "tarot", true),
        AppCard(2, "The High Priestess", createTarotCardSvg("II", "The High Priestess", "☽", "#9ca3af"), listOf("Intuition", "Mystery"), "Trust inner voice.", "Ignoring gut.", "Water", "☽", "tarot", true),
        AppCard(3, "The Empress", createTarotCardSvg("III", "The Empress", "♀", "#78b584"), listOf("Abundance", "Nurturing"), "Growth.", "Blockages.", "Earth", "♀", "tarot", true),
        AppCard(4, "The Emperor", createTarotCardSvg("IV", "The Emperor", "♈", "#c95147"), listOf("Authority", "Stability"), "Order.", "Tyranny.", "Fire", "♈", "tarot", true),
        AppCard(5, "The Hierophant", createTarotCardSvg("V", "The Hierophant", "☩", "#d4a373"), listOf("Wisdom", "Tradition"), "Establish traditions.", "Challenging dogmas.", "Earth", "☩", "tarot", true),
        AppCard(6, "The Lovers", createTarotCardSvg("VI", "The Lovers", "♡", "#e879a9"), listOf("Love", "Harmony"), "Soul connection.", "Misalignment.", "Air", "♡", "tarot", true),
        AppCard(7, "The Chariot", createTarotCardSvg("VII", "The Chariot", "⚔", "#60a5fa"), listOf("Determination", "Willpower"), "Harness drives.", "Loss of control.", "Water", "⚔", "tarot", true),
        AppCard(8, "Strength", createTarotCardSvg("VIII", "Strength", "♌", "#f59e0b"), listOf("Courage", "Compassion"), "True power is soft.", "Self-doubt.", "Fire", "♌", "tarot", true),
        AppCard(9, "The Hermit", createTarotCardSvg("IX", "The Hermit", "🏮", "#94a3b8"), listOf("Searching", "Solitude"), "Withdraw for reflection.", "Isolation.", "Earth", "🏮", "tarot", true),
        AppCard(10, "Wheel of Fortune", createTarotCardSvg("X", "Wheel of Fortune", "☸", "#10b981"), listOf("Cycles", "Karma"), "Inevitable cycles.", "Resisting change.", "Fire", "☸", "tarot", true),
        AppCard(11, "Justice", createTarotCardSvg("XI", "Justice", "⚖", "#38bdf8"), listOf("Fairness", "Truth"), "Radical honesty.", "Dishonesty.", "Air", "⚖", "tarot", true),
        AppCard(12, "The Hanged Man", createTarotCardSvg("XII", "The Hanged Man", "⚓", "#818cf8"), listOf("Surrender", "Perspective"), "Willful sacrifice.", "Stalling.", "Water", "⚓", "tarot", true),
        AppCard(13, "Death", createTarotCardSvg("XIII", "Death", "☠", "#a855f7"), listOf("Transformation", "Renewal"), "Endings for rebirth.", "Fear of change.", "Water", "☠", "tarot", true),
        AppCard(14, "Temperance", createTarotCardSvg("XIV", "Temperance", "⚗", "#34d399"), listOf("Balance", "Purpose"), "Blending opposites.", "Imbalance.", "Fire", "⚗", "tarot", true),
        AppCard(15, "The Devil", createTarotCardSvg("XV", "The Devil", "⛧", "#ef4444"), listOf("Shadow", "Bondage"), "Face unhealthy habits.", "Breaking free.", "Earth", "⛧", "tarot", true),
        AppCard(16, "The Tower", createTarotCardSvg("XVI", "The Tower", "⚡", "#f97316"), listOf("Upheaval", "Revelation"), "Sudden awakening.", "Fear of collapse.", "Fire", "⚡", "tarot", true),
        AppCard(17, "The Star", createTarotCardSvg("XVII", "The Star", "★", "#38bdf8"), listOf("Hope", "Faith"), "Clear skies.", "Hopelessness.", "Air", "★", "tarot", true),
        AppCard(18, "The Moon", createTarotCardSvg("XVIII", "The Moon", "☽", "#93c5fd"), listOf("Illusion", "Dreams"), "Tune intuition.", "Unveiling deception.", "Water", "☽", "tarot", true),
        AppCard(19, "The Sun", createTarotCardSvg("XIX", "The Sun", "☼", "#eab308"), listOf("Joy", "Success"), "Unbridled light.", "Clouded optimism.", "Fire", "☼", "tarot", true),
        AppCard(20, "Judgement", createTarotCardSvg("XX", "Judgement", "🕪", "#a78bfa"), listOf("Rebirth", "Awakening"), "Step into alignment.", "Self-criticism.", "Fire", "🕪", "tarot", true),
        AppCard(21, "The World", createTarotCardSvg("XXI", "The World", "🜛", "#2dd4bf"), listOf("Completion", "Integration"), "Mastery achieved.", "Lack of closure.", "Earth", "🜛", "tarot", true)
    )

    val INITIAL_DECKS = listOf(
        AppDeck(
            id = "tarot-major-arcana",
            name = "Tarot (Major Arcana)",
            description = "The 22 primary archetypes of spiritual evolution.",
            cardCount = TAROT_MAJOR_ARCANA.size,
            isCustom = false,
            cards = TAROT_MAJOR_ARCANA,
            accentColor = "#e6a147"
        )
    )
}
