import pyaudio
import numpy as np
import wave
import librosa
import plotly.express as px

class RaagPlayer:
  CHUNK = 1024
  FORMAT = pyaudio.paInt16
  CHANNELS = 1
  RATE = 44100 
  DURATION = 0.7
  base = 200

  notes_list = {'S':1, 
                'R1':16/15,
                'R2':9/8,

                'R3':6/5 - 5e-2,


                'G1':6/5,
                'G2':5/4,

                'G3':4/3 - 5e-2,


                'M1':4/3,
                'M2':45/32,
                'P':3/2,
                'D1':8/5,
                'D2':5/3,


                'D3':1.69,


                'N1':16/9,
                'N2':15/8,


                'N3':1.9,
                'S2':2
}
  

  
  def __init__(self, play_notes = []):
    if play_notes == []: return
    # print(play_notes)

    if len(play_notes)!=2: 
      self.generate_note(self.aaro_avro(play_notes))
      
    else:
      print(play_notes)
      aaro = play_notes[0]
      avro = play_notes[1]
      
      aaro = aaro[:-1] + ['S2' if 'S' in aaro[-1] else aaro[-1]]
      avro = [i if i!='S' else 'S2' for i in avro[:-1]] + [avro[-1]]

      aaroavro = [(n,self.notes_list[n]*self.base) for n in aaro] + [('\n',0)] + [(n,self.notes_list[n]*self.base) for n in avro]
      self.generate_note(aaroavro)



  def aaro_avro(self, raag):
    freq_tuple = [(n,self.notes_list[n]) for n in raag] + ["S2"]
    return [(note,self.base*v) for note,v in 
            freq_tuple + [('\n',0)] + freq_tuple[::-1]]

  def generate_note(self, notes):
    
    p = pyaudio.PyAudio()
    stream = p.open(format=self.FORMAT,
                      channels=self.CHANNELS,
                      rate=self.RATE,
                      output=True)
    
    for (n,freq) in notes:
      if n in ['S','P']: n+=' '
      print(n, end=" ")
      
      samples = [int(np.sin(2*np.pi*n*freq/self.RATE) * 32767) for n in range(int(self.RATE*self.DURATION))]

      silence_length = int(self.RATE * 0.1)
      padded_samples = np.zeros(silence_length + len(samples) + silence_length)
      padded_samples[silence_length:silence_length+len(samples)] = samples

      packed_samples = wave.struct.pack('h'*len(padded_samples), *padded_samples.astype(int))  # 'h' for signed short
      stream.write(packed_samples)
      
    stream.stop_stream()
    stream.close()

    p.terminate()


if __name__=='__main__':

  play_notes = ['S','R2','G2','M1','P','D2','N2']
  a = RaagPlayer(play_notes)

  print(a.notes_list)


