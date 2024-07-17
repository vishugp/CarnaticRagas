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

  notes_list = {'Sa':1, 
                'Ri1':16/15,
                'Ri2':9/8,
                'Ga1':6/5,
                'Ga2':81/64,
                'Ma1':4/3,
                'Ma2':45/32,
                'Pa':3/2,
                'Da1':8/5,
                'Da2':27/16,
                'Ni1':16/9,
                'Ni2':15/8 
}
  
  def __init__(self, play_notes):
    print("Hi")
    self.generate_note(self.aaro_avro(play_notes))


  def aaro_avro(self, raag):
    freq_tuple = [(n,self.notes_list[n]) for n in play_notes]
    return [(note,self.base*v) for note,v in freq_tuple + [('Sa2',2),('   ',0),('Sa2',2)] + freq_tuple[::-1]]

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

  play_notes = ['Sa','Ri2','Ga2','Ma1','Pa','Da2','Ni2']


  a = RaagPlayer(play_notes)


