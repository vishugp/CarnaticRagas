import pyaudio
import numpy as np
import wave

class RaagPlayer:
  CHUNK = 1024
  FORMAT = pyaudio.paInt16
  CHANNELS = 2
  RATE = 44100 
  DURATION = 2
  base = 200

  notes_list = {'S':1, 
                'R1':16/15,
                'R2':9/8,
                'G1':6/5,
                'G2':81/64,
                'M1':4/3,
                'M2':45/32,
                'P':3/2,
                'D1':8/5,
                'D2':27/16,
                'N1':16/9,
                'N2':15/8 
}
  
  def __init__(self, play_notes):
    print("Hi")
    self.generate_note(self.aaro_avro(play_notes))


  def aaro_avro(self, raag):
    freq_tuple = [(n,self.notes_list[n]) for n in play_notes]
    return [(note,self.base*v) for note,v in freq_tuple + [('S2',2),('   ',0),('S2',2)] + freq_tuple[::-1]]

  def generate_note(self, notes):
    
    p = pyaudio.PyAudio()
    stream = p.open(format=self.FORMAT,
                      channels=self.CHANNELS,
                      rate=self.RATE,
                      output=True)
    
    for (n,freq) in notes:
      print(n, freq)
      samples = [int(np.sin(2*np.pi*n*freq/self.RATE) * 32767) for n in range(int(self.RATE*self.DURATION))]
      packed_samples = wave.struct.pack('h'*len(samples), *samples)  # 'h' for signed short
      stream.write(packed_samples)
    stream.stop_stream()
    stream.close()

    p.terminate()




if __name__=='__main__':

  play_notes = ['S','R2','G2','M1','P','D2','N2']
  a = RaagPlayer(play_notes)


