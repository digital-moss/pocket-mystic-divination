import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_DECKS } from './data/defaultDecks';
import { Deck, ParsedCard, DrawState } from './types';
import { HeaderBar, ActiveTab } from './components/HeaderBar';
import { CardContainer } from './components/CardContainer';
import { ShakeControl } from './components/ShakeControl';
import { CardDetailsModal } from './components/CardDetailsModal';
import { DeckManager } from './components/DeckManager';
import { JournalView } from './components/JournalView';
import { AndroidCodeViewer } from './components/AndroidCodeViewer';
import { HardwareChassis } from './components/HardwareChassis';
import { getSavedCustomDecks } from './services/deckImporter';
import { 
  getCardAssociations, 
  addCardAssociation, 
  removeCardAssociation 
} from './services/cardAssociations';
import { shakeDetector } from './services/shakeDetector';
import { haptics } from './services/haptics';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('draw');
  const [isHardwareFrame, setIsHardwareFrame] = useState(false);

  // Decks state: defaults + user custom decks from local storage, hydrated with user-edited associations
  const [decks, setDecks] = useState<Deck[]>(() => {
    const customDecks = getSavedCustomDecks();
    const rawDecks = [...INITIAL_DECKS, ...customDecks];

    return rawDecks.map((d) => ({
      ...d,
      cards: d.cards.map((c) => ({
        ...c,
        keywords: getCardAssociations(d.id, c.index, c.name, c.keywords)
      }))
    }));
  });

  const [activeDeckId, setActiveDeckId] = useState<string>(INITIAL_DECKS[0].id);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0] || INITIAL_DECKS[0];

  // Draw State
  const [drawState, setDrawState] = useState<DrawState>(() => {
    // Pick initial random card
    const firstDeck = decks[0] || INITIAL_DECKS[0];
    const randomCard = firstDeck.cards[0];
    return {
      activeDeckId: firstDeck.id,
      currentCard: randomCard,
      isFlipped: false,
      isReversed: false,
      isShuffling: false,
      shuffleCount: 0,
      drawnAt: Date.now()
    };
  });

  // Reversals enabled preference
  const [allowReversals, setAllowReversals] = useState<boolean>(true);

  // Check if current deck is a Tarot deck
  const isTarotDeck = activeDeck.cards.some((c) => c.deckType === 'tarot');

  // Determine active arcana option ('both' | 'major' | 'minor')
  const activeArcanaOption: 'both' | 'major' | 'minor' =
    activeDeckId === 'tarot-major-arcana'
      ? 'major'
      : activeDeckId === 'tarot-minor-arcana'
      ? 'minor'
      : 'both';

  // Handler for switching arcana pool (Major, Minor, Both Arcana)
  const handleSelectArcanaOption = (option: 'both' | 'major' | 'minor') => {
    let targetDeckId = 'tarot-full-deck';
    if (option === 'major') targetDeckId = 'tarot-major-arcana';
    if (option === 'minor') targetDeckId = 'tarot-minor-arcana';

    const targetDeck = decks.find((d) => d.id === targetDeckId) || INITIAL_DECKS.find((d) => d.id === targetDeckId);
    if (!targetDeck) return;

    setActiveDeckId(targetDeck.id);

    setDrawState((prev) => {
      const cardExistsInTarget = targetDeck.cards.some((c) => c.index === prev.currentCard?.index);
      const nextCard = cardExistsInTarget ? prev.currentCard : targetDeck.cards[0];
      return {
        ...prev,
        activeDeckId: targetDeck.id,
        currentCard: nextCard,
        isFlipped: false
      };
    });

    haptics.triggerTouch();
  };

  // Toggle Reversal orientation for active card with smooth overshoot animation
  const handleToggleReversal = useCallback(() => {
    haptics.triggerTouch();
    setDrawState((prev) => {
      const nextReversed = !prev.isReversed;
      return {
        ...prev,
        isReversed: nextReversed,
        // Reveal card face so user witnesses the 180° rotation and snap animation
        isFlipped: true
      };
    });

    setAllowReversals((prev) => !drawState.isReversed);

    // Haptic feedback tick when rotation snaps firmly into place
    setTimeout(() => {
      haptics.triggerShuffleTick(1.3);
    }, 520);
  }, [drawState.isReversed]);

  // Modal inspection state
  const [inspectingCard, setInspectingCard] = useState<ParsedCard | null>(null);

  // Update card associations globally in state
  const handleUpdateCardAssociations = useCallback((deckId: string, cardIndex: number, newKeywords: string[]) => {
    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id !== deckId) return d;
        return {
          ...d,
          cards: d.cards.map((c) =>
            c.index === cardIndex ? { ...c, keywords: newKeywords } : c
          )
        };
      })
    );

    setDrawState((prev) => {
      if (prev.currentCard && prev.currentCard.index === cardIndex && prev.activeDeckId === deckId) {
        return {
          ...prev,
          currentCard: { ...prev.currentCard, keywords: newKeywords }
        };
      }
      return prev;
    });

    if (inspectingCard && inspectingCard.index === cardIndex) {
      setInspectingCard((prev) => (prev ? { ...prev, keywords: newKeywords } : null));
    }
  }, [inspectingCard]);

  // Quick word addition directly from CardContainer
  const handleQuickAddAssociation = (word: string) => {
    if (!drawState.currentCard) return;
    const updated = addCardAssociation(
      activeDeck.id,
      drawState.currentCard.index,
      drawState.currentCard.name,
      word,
      drawState.currentCard.keywords
    );
    handleUpdateCardAssociations(activeDeck.id, drawState.currentCard.index, updated);
  };

  // Quick word removal directly from CardContainer
  const handleQuickRemoveAssociation = (word: string) => {
    if (!drawState.currentCard) return;
    const updated = removeCardAssociation(
      activeDeck.id,
      drawState.currentCard.index,
      drawState.currentCard.name,
      word,
      drawState.currentCard.keywords
    );
    handleUpdateCardAssociations(activeDeck.id, drawState.currentCard.index, updated);
  };

  // Select random card from active deck
  const drawRandomCard = useCallback(() => {
    if (!activeDeck || activeDeck.cards.length === 0) return;

    setDrawState((prev) => ({ ...prev, isShuffling: true, isFlipped: false }));

    // Mechanical riffle haptic ticks
    haptics.triggerShuffleTick(1.0);
    setTimeout(() => haptics.triggerShuffleTick(1.2), 120);
    setTimeout(() => haptics.triggerShuffleTick(1.4), 240);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * activeDeck.cards.length);
      const chosenCard = activeDeck.cards[randomIndex];
      const isReversed = allowReversals ? Math.random() < 0.35 : false; // Respect reversals toggle setting

      setDrawState((prev) => ({
        ...prev,
        currentCard: chosenCard,
        isFlipped: false,
        isReversed,
        isShuffling: false,
        shuffleCount: prev.shuffleCount + 1,
        drawnAt: Date.now()
      }));

      haptics.triggerCardReveal();
    }, 450);
  }, [activeDeck, allowReversals]);

  // Flip card
  const handleFlipCard = useCallback(() => {
    if (drawState.isShuffling) return;

    const willBeFlipped = !drawState.isFlipped;
    setDrawState((prev) => ({
      ...prev,
      isFlipped: willBeFlipped
    }));

    if (willBeFlipped) {
      haptics.triggerCardReveal();
    } else {
      haptics.triggerTouch();
    }
  }, [drawState.isShuffling, drawState.isFlipped]);

  // Reset card back to hidden
  const handleResetCard = () => {
    setDrawState((prev) => ({ ...prev, isFlipped: false }));
  };

  // Physical Accelerometer & Keyboard Shake bindings
  useEffect(() => {
    const unsub = shakeDetector.subscribe(() => {
      if (activeTab === 'draw') {
        drawRandomCard();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        drawRandomCard();
      } else if (e.key === 'f' || e.key === 'F' || e.key === 'Enter') {
        e.preventDefault();
        handleFlipCard();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleToggleReversal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsub();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, drawRandomCard, handleFlipCard, handleToggleReversal]);

  // Switch deck
  const handleSelectDeck = (deckId: string) => {
    setActiveDeckId(deckId);
    const targetDeck = decks.find((d) => d.id === deckId);
    if (targetDeck && targetDeck.cards.length > 0) {
      setDrawState((prev) => ({
        ...prev,
        activeDeckId: deckId,
        currentCard: targetDeck.cards[0],
        isFlipped: false,
        isReversed: false
      }));
    }
    setActiveTab('draw');
  };

  const handleDeckImported = (newDeck: Deck) => {
    setDecks((prev) => [newDeck, ...prev.filter((d) => d.id !== newDeck.id)]);
    setActiveDeckId(newDeck.id);
    if (newDeck.cards.length > 0) {
      setDrawState((prev) => ({
        ...prev,
        activeDeckId: newDeck.id,
        currentCard: newDeck.cards[0],
        isFlipped: false,
        isReversed: false
      }));
    }
    setActiveTab('draw');
  };

  const handleDeckDeleted = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (activeDeckId === deckId) {
      setActiveDeckId(INITIAL_DECKS[0].id);
      setDrawState((prev) => ({
        ...prev,
        activeDeckId: INITIAL_DECKS[0].id,
        currentCard: INITIAL_DECKS[0].cards[0],
        isFlipped: false
      }));
    }
  };

  const renderDailyDrawContent = () => (
    <div className="w-full flex flex-col items-center justify-between py-2 sm:py-4 flex-1">
      <CardContainer
        card={drawState.currentCard}
        isFlipped={drawState.isFlipped}
        isReversed={drawState.isReversed}
        isShuffling={drawState.isShuffling}
        onFlip={handleFlipCard}
        onInspect={() => {
          if (drawState.currentCard) {
            setInspectingCard(drawState.currentCard);
          }
        }}
        deckName={activeDeck.name}
        onRemoveAssociation={handleQuickRemoveAssociation}
        onAddAssociation={handleQuickAddAssociation}
        onToggleReversal={handleToggleReversal}
        isTarotDeck={isTarotDeck}
        activeArcanaOption={activeArcanaOption}
        onSelectArcanaOption={handleSelectArcanaOption}
      />

      <ShakeControl
        isShuffling={drawState.isShuffling}
        onShake={drawRandomCard}
        onResetCard={handleResetCard}
        isFlipped={drawState.isFlipped}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e5e5] flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      {/* Header Bar */}
      <HeaderBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isHardwareFrame={isHardwareFrame}
        onToggleHardwareFrame={() => setIsHardwareFrame(!isHardwareFrame)}
        activeDeckName={activeDeck.name}
        totalCards={activeDeck.cardCount}
      />

      {/* Main App Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-6xl w-full mx-auto">
        {activeTab === 'draw' && (
          isHardwareFrame ? (
            <HardwareChassis
              onPhysicalShuffle={drawRandomCard}
              onPhysicalFlip={handleFlipCard}
              onOpenJournal={() => setActiveTab('journal')}
              onOpenDecks={() => setActiveTab('decks')}
              isShuffling={drawState.isShuffling}
              isFlipped={drawState.isFlipped}
            >
              {renderDailyDrawContent()}
            </HardwareChassis>
          ) : (
            <div className="w-full max-w-md mx-auto py-2">
              {renderDailyDrawContent()}
            </div>
          )
        )}

        {activeTab === 'decks' && (
          <DeckManager
            decks={decks}
            activeDeckId={activeDeckId}
            onSelectDeck={handleSelectDeck}
            onDeckImported={handleDeckImported}
            onDeckDeleted={handleDeckDeleted}
            onCardAssociationsChanged={handleUpdateCardAssociations}
          />
        )}

        {activeTab === 'journal' && (
          <JournalView onNavigateToDraw={() => setActiveTab('draw')} />
        )}

        {activeTab === 'kotlin' && <AndroidCodeViewer />}
      </main>

      {/* Inspection Modal for active draw reflection and meaning */}
      {inspectingCard && (
        <CardDetailsModal
          card={inspectingCard}
          isReversed={drawState.isReversed}
          deckName={activeDeck.name}
          deckId={activeDeck.id}
          onClose={() => setInspectingCard(null)}
          onAssociationsUpdated={(newKws) => {
            handleUpdateCardAssociations(activeDeck.id, inspectingCard.index, newKws);
          }}
          onSavedToJournal={() => {
            // Callback when saved to journal
          }}
        />
      )}

      {/* Footer Minimal Status Bar */}
      <footer className="w-full border-t border-[#1c1c1c] bg-[#0c0c0c] py-2 px-4 text-center text-[10px] font-mono-code text-neutral-500 select-none">
        <span>POCKET MYSTIC - Customizable Divination Tool - Tarot, Runes, I-Ching • E-INK MINIMAL HARDWARE AESTHETIC (#121212)</span>
      </footer>
    </div>
  );
}
