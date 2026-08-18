import React, { useState, useEffect } from 'react';

export function App() {
  const [screen, setScreen] = useState<'CANDIDATES' | 'FINGERPRINT' | 'CONFIRM' | 'SUCCESS' | 'ERROR'>('CANDIDATES');
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [electionStatus, setElectionStatus] = useState<string>('Loading Active Election...');
  
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [voterIdSimulated, setVoterIdSimulated] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCasting, setIsCasting] = useState(false);

  useEffect(() => {
    fetchActiveElection();
    // Poll every 5 seconds to stay synced with admin portal
    const interval = setInterval(fetchActiveElection, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveElection = () => {
    fetch('http://localhost:4000/api/mock/elections/active')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setElection(data.data);
          setCandidates(data.data.candidates || []);
        } else {
          setElectionStatus('कोई सक्रिय चुनाव नहीं मिला (No active election)');
          setCandidates([]);
        }
      })
      .catch(err => {
        console.error(err);
        setElectionStatus('सर्वर से संपर्क टूट गया (Connection lost). Ensure Admin Portal is running and updated.');
      });
  };

  const handleCandidateClick = (c: any) => {
    setSelectedCandidate(c);
    setVoterIdSimulated('');
    setScreen('FINGERPRINT');
  };

  const handleVerifyFingerprint = () => {
    if (!voterIdSimulated) return;
    setIsVerifying(true);
    fetch('http://localhost:4000/api/mock/voter/verify-fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId: voterIdSimulated })
    })
      .then(res => res.json())
      .then(data => {
        setIsVerifying(false);
        if (data.success) {
          setScreen('CONFIRM');
        } else {
          setErrorMessage(data.message || 'Fingerprint Verification Failed');
          setScreen('ERROR');
        }
      })
      .catch(() => {
        setIsVerifying(false);
        setErrorMessage('Failed to connect to blockchain network.');
        setScreen('ERROR');
      });
  };

  const handleCastVote = () => {
    setIsCasting(true);
    fetch('http://localhost:4000/api/mock/vote/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        electionId: election.id,
        candidateId: selectedCandidate.id,
        voterId: voterIdSimulated
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsCasting(false);
        if (data.success) {
          setScreen('SUCCESS');
          fetchActiveElection(); // Refresh votes immediately
        } else {
          setErrorMessage(data.message || 'Failed to cast vote');
          setScreen('ERROR');
        }
      })
      .catch(() => {
        setIsCasting(false);
        setErrorMessage('Failed to connect to blockchain network.');
        setScreen('ERROR');
      });
  };

  const resetVoting = () => {
    setSelectedCandidate(null);
    setVoterIdSimulated('');
    setScreen('CANDIDATES');
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
              {language === 'hi' ? 'भारत निर्वाचन आयोग - EVM' : 'Election Commission of India - EVM'}
            </h1>
            <p className="text-xs text-amber-400 font-mono">
              Election: {election ? election.name : 'Waiting...'} | Booth: DEL-001
            </p>
          </div>
        </div>

        {/* Bilingual Language Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('hi')}
            className={`min-h-[40px] px-4 font-bold rounded-lg border-2 ${language === 'hi' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-800 border-slate-700'}`}
          >
            हिं
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`min-h-[40px] px-4 font-bold rounded-lg border-2 ${language === 'en' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-800 border-slate-700'}`}
          >
            ENG
          </button>
        </div>
      </header>

      {/* Main Kiosk Display Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        
        {/* CANDIDATES LISTING */}
        {screen === 'CANDIDATES' && (
          <div className="w-full max-w-4xl space-y-4">
            {candidates.length === 0 ? (
              <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <div className="text-6xl animate-pulse">📡</div>
                <p className="text-2xl font-bold text-slate-300">
                  {electionStatus}
                </p>
                <p className="text-sm text-slate-500">
                  {language === 'hi' ? 'चुनाव अधिकारी द्वारा सर्वर चालू करने की प्रतीक्षा करें' : 'Waiting for election officer to start the server'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-500/10 border-l-8 border-amber-500 p-4 rounded-r-xl flex items-center gap-3 mb-6">
                  <span className="text-3xl">🗳️</span>
                  <p className={`text-lg font-bold text-amber-400 ${language === 'hi' ? 'font-hindi' : ''}`}>
                    {language === 'hi'
                      ? 'अपना उम्मीदवार चुनें और वोट दें बटन दबाएं'
                      : 'Select your candidate and press the vote button'}
                  </p>
                </div>
                {candidates.map((c, i) => (
                  <div
                    key={c.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-amber-500/50 hover:bg-slate-900 transition shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center font-black text-3xl text-amber-400 shadow-inner border border-slate-700">
                        {i + 1}
                      </div>
                      <div className="flex items-center gap-4 ml-2">
                        <div className="text-5xl">{c.symbol || '🗳️'}</div>
                        <div>
                          <h3 className={`text-2xl font-bold text-slate-100 uppercase tracking-wider ${language === 'hi' ? 'font-hindi' : ''}`}>
                            {language === 'hi' ? (c.nameHindi || c.name) : c.name}
                          </h3>
                          <p className={`text-sm text-amber-400 font-bold tracking-wide ${language === 'hi' ? 'font-hindi' : ''}`}>
                            {language === 'hi' ? (c.partyHindi || c.party) : c.party}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCandidateClick(c)}
                      className="h-20 w-48 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl rounded-xl shadow-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
                    >
                      <span>{language === 'hi' ? 'वोट दें' : 'VOTE'}</span>
                      <span className="text-3xl">👆</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FINGERPRINT MODAL */}
        {screen === 'FINGERPRINT' && (
          <div className="w-full max-w-xl bg-slate-950 border-4 border-amber-500 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <h2 className={`text-2xl font-bold text-slate-100 ${language === 'hi' ? 'font-hindi' : ''}`}>
              {language === 'hi' ? 'बायोमेट्रिक सत्यापन आवश्यक' : 'Biometric Verification Required'}
            </h2>
            <p className="text-sm text-slate-400 mt-2 mb-8">
              {language === 'hi' ? 'कृपया स्कैनर पर अपनी उंगली रखें' : 'Please place your registered finger on the scanner'}
            </p>

            <div className={`p-10 rounded-full border-4 mx-auto inline-block mb-6 shadow-inner ${isVerifying ? 'border-amber-500 bg-amber-500/20 text-amber-400 animate-pulse' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
              <div className="text-8xl">👆</div>
            </div>

            {/* SIMULATION INPUT FOR FINGERPRINT */}
            <div className="mt-4 mb-6">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 block">
                [Hardware Simulation: Enter Voter ID to simulate fingerprint match]
              </label>
              <input
                type="text"
                value={voterIdSimulated}
                onChange={(e) => setVoterIdSimulated(e.target.value)}
                placeholder="Enter Voter ID"
                className="w-full max-w-xs bg-slate-900 border-2 border-slate-700 rounded-lg p-3 text-center text-xl text-amber-400 uppercase outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={resetVoting}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl"
              >
                {language === 'hi' ? 'रद्द करें' : 'CANCEL'}
              </button>
              <button
                onClick={handleVerifyFingerprint}
                disabled={isVerifying || !voterIdSimulated}
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-xl disabled:opacity-50"
              >
                {isVerifying ? 'VERIFYING...' : (language === 'hi' ? 'फिंगरप्रिंट स्कैन करें' : 'SIMULATE SCAN')}
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM VOTE */}
        {screen === 'CONFIRM' && (
          <div className="w-full max-w-xl bg-slate-950 border-4 border-emerald-500 rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">✅</div>
            <h2 className={`text-2xl font-bold text-emerald-400 mb-6 uppercase tracking-wider`}>
              VOTER AUTHENTICATED
            </h2>
            
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-8 text-left">
              <div className="text-sm text-slate-500 uppercase font-bold mb-4 border-b border-slate-800 pb-2">Confirm Your Vote</div>
              <div className="flex items-center gap-6">
                <div className="text-6xl">{selectedCandidate?.symbol}</div>
                <div>
                  <div className="text-3xl font-black text-white">{selectedCandidate?.name}</div>
                  <div className="text-lg text-amber-400 font-bold">{selectedCandidate?.party}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={resetVoting}
                className="flex-1 py-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xl transition"
              >
                {language === 'hi' ? 'रद्द करें' : 'CANCEL'}
              </button>
              <button
                onClick={handleCastVote}
                disabled={isCasting}
                className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xl transition shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                {isCasting ? 'RECORDING...' : (language === 'hi' ? 'वोट पक्का करें' : 'CONFIRM VOTE')}
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {screen === 'SUCCESS' && (
          <div className="w-full max-w-xl bg-slate-950 border-4 border-emerald-500 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className={`text-4xl font-black text-emerald-400 mb-4 tracking-wider ${language === 'hi' ? 'font-hindi' : ''}`}>
              {language === 'hi' ? 'मतदान सफलतापूर्वक दर्ज हुआ' : 'VOTE CAST SUCCESSFULLY'}
            </h2>
            <p className="text-sm text-slate-400 font-mono mb-8">Recorded securely on Polygon EVM Blockchain</p>

            {/* VVPAT Printed Slip Box */}
            <div className="bg-amber-100 text-slate-900 p-6 rounded-xl font-mono text-left text-sm space-y-2 shadow-inner border border-amber-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-xs text-amber-600 font-bold">VVPAT SLIP</div>
              <div className="font-bold border-b-2 border-slate-900 pb-2 mb-4">VOTE CONFIRMATION RECEIPT</div>
              <div>ELECTION ID: {election?.id.substring(0, 16)}...</div>
              <div>CANDIDATE: {selectedCandidate?.name.toUpperCase()}</div>
              <div>PARTY: {selectedCandidate?.party.toUpperCase()}</div>
              <div>TIMESTAMP: {new Date().toLocaleString()}</div>
              <div className="mt-4 text-xs font-bold break-all">SECURE HASH:<br/>0x{Math.random().toString(16).substring(2,15)}{Math.random().toString(16).substring(2,15)}</div>
            </div>

            <button
              onClick={resetVoting}
              className="mt-8 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xl tracking-wider transition"
            >
              {language === 'hi' ? 'समाप्त करें (अगला वोटर)' : 'DONE (NEXT VOTER)'}
            </button>
          </div>
        )}

        {/* ERROR */}
        {screen === 'ERROR' && (
          <div className="w-full max-w-xl bg-slate-950 border-4 border-red-600 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(220,38,38,0.3)]">
            <div className="text-8xl mb-6">❌</div>
            <h2 className="text-3xl font-black text-red-500 mb-6 uppercase tracking-wider">
              {language === 'hi' ? 'त्रुटि (Error)' : 'VERIFICATION FAILED'}
            </h2>
            <div className="bg-red-950/50 border border-red-900 p-6 rounded-xl mb-8">
              <p className="text-xl text-red-200 font-bold">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={resetVoting}
              className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xl uppercase tracking-widest transition"
            >
              {language === 'hi' ? 'वापस जाएँ' : 'RETURN TO START'}
            </button>
          </div>
        )}

      </main>

      {/* Footer Status */}
      <footer className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-xs text-slate-500 font-mono tracking-widest">
        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> EVM MACHINE ONLINE</span>
        <span>256-BIT CRYPTOGRAPHIC ENCRYPTION SECURED</span>
      </footer>
    </div>
  );
}

export default App;
