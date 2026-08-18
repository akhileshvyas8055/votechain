import React, { useState } from 'react';

export function App() {
  const [screen, setScreen] = useState<'WELCOME' | 'VOTING' | 'VERIFY' | 'CONFIRM'>('WELCOME');
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [voterId, setVoterId] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const candidates = [
    {
      id: 1,
      name: 'Dr. Elena Rostova',
      nameHindi: 'डॉ. एलेना रोस्तोवा',
      party: 'Progressive Alliance',
      partyHindi: 'प्रोग्रेसिव अलायंस',
      symbol: '☀️',
      symbolName: 'Sun / सूरज',
      photo: '/images/candidate1.png',
    },
    {
      id: 2,
      name: 'Marcus Chen',
      nameHindi: 'मार्कस चेन',
      party: 'Decentralization Coalition',
      partyHindi: 'डिसेंट्रलाइजेशन गठबंधन',
      symbol: '🌳',
      symbolName: 'Tree / पेड़',
      photo: '/images/candidate2.png',
    },
    {
      id: 3,
      name: 'Sarah Jenkins',
      nameHindi: 'सारा जेनकिंस',
      party: 'Independent Alliance',
      partyHindi: 'निर्दलीय गठबंधन',
      symbol: '🚩',
      symbolName: 'Flag / झंडा',
      photo: '/images/elena_rostova.png',
    },
  ];

  const handleKeypad = (key: string) => {
    if (key === 'back') {
      setVoterId((prev) => prev.slice(0, -1));
    } else if (key === 'clear') {
      setVoterId('');
    } else if (voterId.length < 10) {
      setVoterId((prev) => prev + key);
    }
  };

  const handleVoteSelect = (c: any) => {
    setSelectedCandidate(c);
    setShowConfirmModal(true);
  };

  const handleConfirmVote = () => {
    setShowConfirmModal(false);
    setScreen('VERIFY');
  };

  const handleScanBiometric = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScreen('CONFIRM');
    }, 2500);
  };

  const handleReset = () => {
    setVoterId('');
    setSelectedCandidate(null);
    setScreen('WELCOME');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* ECI Header */}
      <header className="bg-slate-950 border-b-4 border-amber-500 px-6 py-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-2xl shadow-lg">
            🇮🇳
          </div>
          <div>
            <h1 className={`text-xl font-bold text-slate-100 ${language === 'hi' ? 'font-hindi' : ''}`}>
              {language === 'hi' ? 'भारत निर्वाचन आयोग' : 'Election Commission of India'}
            </h1>
            <p className="text-xs text-amber-400 font-mono">
              VoteChain EVM Kiosk | Booth: DEL-001-CONNAUGHT
            </p>
          </div>
        </div>

        {/* Bilingual Language Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('hi')}
            className={`min-h-[48px] px-6 text-lg font-bold rounded-xl border-2 transition-all ${
              language === 'hi'
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            हिं
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`min-h-[48px] px-6 text-lg font-bold rounded-xl border-2 transition-all ${
              language === 'en'
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            ENG
          </button>
        </div>
      </header>

      {/* Main Kiosk Display Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        
        {/* SCREEN 1: WELCOME / VOTER ID KEYPAD */}
        {screen === 'WELCOME' && (
          <div className="w-full max-w-2xl bg-slate-950 rounded-3xl border-4 border-slate-800 p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="text-6xl">🗳️</div>
              <h2 className={`text-3xl font-bold text-slate-100 ${language === 'hi' ? 'font-hindi' : ''}`}>
                {language === 'hi' ? 'स्वागत है - अपना Voter ID दर्ज करें' : 'Welcome - Enter Your Voter ID'}
              </h2>
              <p className="text-sm text-slate-400 font-mono">Blockchain-Secured Electronic Voting Machine</p>
            </div>

            {/* Input Display */}
            <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 text-center">
              <input
                value={voterId}
                readOnly
                placeholder={language === 'hi' ? 'VOTER ID दर्ज करें' : 'ENTER VOTER ID'}
                className="w-full bg-transparent text-center text-3xl font-mono text-amber-400 font-bold tracking-widest outline-none"
              />
            </div>

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleKeypad(k)}
                  className="h-16 text-2xl font-bold bg-slate-900 border-2 border-slate-800 hover:border-amber-500 text-slate-100 rounded-xl transition"
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => handleKeypad('back')}
                className="h-16 text-lg font-bold bg-slate-900 border-2 border-slate-800 hover:border-red-500 text-red-400 rounded-xl"
              >
                ← {language === 'hi' ? 'मिटाएं' : 'Back'}
              </button>
              <button
                onClick={() => handleKeypad('0')}
                className="h-16 text-2xl font-bold bg-slate-900 border-2 border-slate-800 hover:border-amber-500 text-slate-100 rounded-xl"
              >
                0
              </button>
              <button
                onClick={() => handleKeypad('clear')}
                className="h-16 text-sm font-bold bg-slate-900 border-2 border-slate-800 hover:border-red-500 text-red-400 rounded-xl"
              >
                {language === 'hi' ? 'साफ़ करें' : 'Clear'}
              </button>
            </div>

            <button
              onClick={() => voterId.length >= 4 && setScreen('VOTING')}
              disabled={voterId.length < 4}
              className="w-full h-16 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-black text-2xl rounded-2xl transition uppercase tracking-wider"
            >
              {language === 'hi' ? 'आगे बढ़ें →' : 'PROCEED →'}
            </button>
          </div>
        )}

        {/* SCREEN 2: CANDIDATE SELECTION */}
        {screen === 'VOTING' && (
          <div className="w-full max-w-4xl space-y-4">
            <div className="bg-amber-500/10 border-l-8 border-amber-500 p-4 rounded-r-xl flex items-center gap-3">
              <span className="text-3xl">👆</span>
              <p className={`text-lg font-bold text-amber-400 ${language === 'hi' ? 'font-hindi' : ''}`}>
                {language === 'hi'
                  ? 'अपने पसंदीदा उम्मीदवार के सामने बने बटन पर स्पर्श करें'
                  : 'Touch the button next to your preferred candidate'}
              </p>
            </div>

            <div className="space-y-3">
              {candidates.map((c, i) => (
                <div
                  key={c.id}
                  className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-amber-500/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-2xl text-amber-400">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold text-slate-100 ${language === 'hi' ? 'font-hindi' : ''}`}>
                        {language === 'hi' ? c.nameHindi : c.name}
                      </h3>
                      <p className={`text-xs text-amber-400 ${language === 'hi' ? 'font-hindi' : ''}`}>
                        {language === 'hi' ? c.partyHindi : c.party}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-4xl">{c.symbol}</div>
                    <button
                      onClick={() => handleVoteSelect(c)}
                      className="h-16 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl rounded-xl shadow-lg border-b-4 border-emerald-800 active:border-b-0 transition flex items-center gap-2"
                    >
                      <span>{language === 'hi' ? 'वोट दें' : 'VOTE'}</span>
                      <span className="text-2xl">👆</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 3: BIOMETRIC SCAN VERIFICATION */}
        {screen === 'VERIFY' && (
          <div className="w-full max-w-xl bg-slate-950 border-4 border-slate-800 rounded-3xl p-8 text-center space-y-6">
            <h2 className={`text-2xl font-bold text-slate-100 ${language === 'hi' ? 'font-hindi' : ''}`}>
              {language === 'hi' ? 'बायोमेट्रिक सत्यापन (फिंगरप्रिंट)' : 'Biometric Fingerprint Verification'}
            </h2>
            <p className="text-sm text-slate-400">Please place your registered finger on the optical sensor</p>

            <div
              onClick={!isScanning ? handleScanBiometric : undefined}
              className={`p-8 rounded-full border-4 cursor-pointer inline-block transition ${
                isScanning
                  ? 'border-amber-500 bg-amber-500/20 text-amber-400 animate-pulse'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-amber-500'
              }`}
            >
              <div className="text-7xl">👆</div>
            </div>

            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              {isScanning ? 'VERIFYING ON POLYGON EVM...' : 'TAP SCANNER ICON TO VERIFY'}
            </div>
          </div>
        )}

        {/* SCREEN 4: SUCCESS CONFIRMATION & VVPAT PRINT */}
        {screen === 'CONFIRM' && (
          <div className="w-full max-w-xl bg-slate-950 border-4 border-emerald-500 rounded-3xl p-8 text-center space-y-6">
            <div className="text-7xl">✅</div>
            <h2 className={`text-3xl font-bold text-emerald-400 ${language === 'hi' ? 'font-hindi' : ''}`}>
              {language === 'hi' ? 'मतदान सफलतापूर्वक दर्ज हुआ' : 'Vote Cast Successfully'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">Recorded on Polygon EVM Smart Contract</p>

            {/* VVPAT Printed Slip Box */}
            <div className="bg-amber-100 text-slate-900 p-4 rounded-xl font-mono text-left text-xs space-y-1 shadow-lg border border-amber-300">
              <div className="font-bold border-b border-slate-900 pb-1 mb-2">VVPAT SLIP CONFIRMATION</div>
              <div>CANDIDATE: {selectedCandidate?.name}</div>
              <div>PARTY: {selectedCandidate?.party}</div>
              <div>TIMESTAMP: {new Date().toLocaleTimeString()}</div>
              <div>TX HASH: 0x9f82...12ba</div>
            </div>

            <button
              onClick={handleReset}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-lg uppercase"
            >
              {language === 'hi' ? 'समाप्त करें' : 'DONE / EXIT'}
            </button>
          </div>
        )}

        {/* CONFIRMATION REVIEW MODAL */}
        {showConfirmModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-950 border-4 border-amber-500 rounded-3xl p-8 max-w-md w-full text-center space-y-6">
              <div className="text-6xl">⚠️</div>
              <h2 className={`text-2xl font-bold text-slate-100 ${language === 'hi' ? 'font-hindi' : ''}`}>
                {language === 'hi' ? 'कृपया पुष्टि करें' : 'Please Confirm'}
              </h2>
              <p className={`text-sm text-slate-300 ${language === 'hi' ? 'font-hindi' : ''}`}>
                {language === 'hi' ? 'क्या आप इस उम्मीदवार को वोट देना चाहते हैं?' : 'Do you want to vote for this candidate?'}
              </p>

              <div className="bg-slate-900 p-4 rounded-2xl border border-amber-500/30 flex items-center gap-4">
                <div className="text-4xl">{selectedCandidate.symbol}</div>
                <div className="text-left">
                  <div className="font-bold text-amber-400">{selectedCandidate.name}</div>
                  <div className="text-xs text-slate-400">{selectedCandidate.party}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="h-14 bg-slate-800 text-slate-200 font-bold rounded-xl"
                >
                  ← {language === 'hi' ? 'वापस' : 'BACK'}
                </button>
                <button
                  onClick={handleConfirmVote}
                  className="h-14 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  {language === 'hi' ? 'पुष्टि करें ✓' : 'CONFIRM ✓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status */}
      <footer className="bg-slate-950 border-t border-slate-800 px-6 py-2 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>ECI VOTECHAIN HARDWARE OS v2.1</span>
        <span>256-BIT CRYPTOGRAPHIC ENCRYPTION ACTIVE</span>
      </footer>
    </div>
  );
}

export default App;
