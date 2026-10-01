/**
 *   Web Audio API  
 */
export function playWindChimeSound() {
  if (typeof window === 'undefined') return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const audioContext = new AudioContextClass();
    
    //  4 （  Pentatonic/A ）
    const frequencies = [880, 1046.5, 1318.5, 1568]; // A5, C6, E6, G6
    const now = audioContext.currentTime;

    frequencies.forEach((freq, index) => {
      //  （50ms-150ms）， Metal 
      const timeOffset = index * 0.08 + Math.random() * 0.04;
      const triggerTime = now + timeOffset;

      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc.type = 'sine'; //  ， Metal 
      osc.frequency.setValueAtTime(freq, triggerTime);

      // Design 
      gainNode.gain.setValueAtTime(0, triggerTime);
      gainNode.gain.linearRampToValueAtTime(0.12, triggerTime + 0.01); // 10ms   (Attack)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, triggerTime + 1.2); // 1.2  (Decay)

      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc.start(triggerTime);
      osc.stop(triggerTime + 1.3); //  
    });
  } catch (error) {
    console.warn('Unable to play wind chime sound', error);
  }
}
