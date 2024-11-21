##############################################################
# PITCH  GRAPHER
# This program listens to live audio and graphs the estimated
# pitch (frequency) of the signal over time.
##############################################################

import pyaudio
import os
import struct
import numpy as np
import matplotlib.pyplot as plt
import time
from scipy.fftpack import fft
from tkinter import TclError

class PitchAnalyzer(object):
    """
    The PitchAnalyzer class accesses and processes live microphone
    data, and plots the pitch (frequency) of the signal in real time.
    """

    def __init__(self):
        """ initialize the PitchAnalyzer class"""

        self.CHUNK = 1024 * 6            # 
        self.FORMAT = pyaudio.paInt16    # 
        self.CHANNELS = 1                # mono signal
        self.RATE = 44100                # resolution (Hz)

        # range of frequencies plotted on the graph (Units = Hz)
        self.low_freq = 200
        self.high_freq = 700

        # set volume threshold for data to be plotted
        # determined by trial and error to ignore noise
        self.threshold = 200000

        # blank lists to hold data for scatter plot
        self.times = []
        self.freqs = []

        # create pyaudio class instance (object)
        self.p = pyaudio.PyAudio()


    def init_plot(self):
        """initialize the matplotlib plot"""
        
        # create maplotlib figure
        self.fig, self.pgraph = plt.subplots(1)

        # frequencies, measured from 0 to RATE with CHUNK levels
        self.x_fft = np.linspace(0, self.RATE, self.CHUNK)

        # customize the plot
        self.pgraph.set_title('ESTIMATED PITCH GRAPH')
        self.pgraph.set_xlabel('time (s)')
        self.pgraph.set_ylabel('frequency (Hz)')
        self.pgraph.set_ylim(self.low_freq, self.high_freq)

        # show the plot
        plt.show(block=False)
        

    def start_stream(self):
        """start streaming audio"""
        # stream object to get data from microphone
        self.stream = self.p.open(
            format=self.FORMAT,
            channels=self.CHANNELS,
            rate=self.RATE,
            input=True,
            output=True,
            frames_per_buffer=self.CHUNK
        )

        print('stream started')

        # for measuring frame rate
        self.frame_count = 0
        self.start_time = time.time()


    def process_stream(self):
        """read and process data and calculate frequency"""
        # binary data
        data = self.stream.read(self.CHUNK)  
        
        # convert data to integers, make np array
        data_int = struct.unpack(str(2 * self.CHUNK) + 'B', data)
        
        # compute FFT (Fast Fourier Transform)
        yf = fft(data_int)

        # get volumes and frequencies of signal
        # and isolate the frequency of the loudest signal
        volumes = np.abs(yf[1:self.CHUNK])
        self.maximum = max(volumes)
        self.frequency = self.x_fft[int(tuple(volumes).index(self.maximum) + 1)]


    def plot_data(self):
        """plot pitch data"""
        if (self.low_freq < self.frequency < self.high_freq and
        self.maximum > self.threshold):
            self.freqs.append(self.frequency)
            self.times.append(time.time() - self.start_time)
        self.pgraph.scatter(self.times, self.freqs, color='b', s=4)
        
        # Set pgraph x-axis to update with time
        self.pgraph.set_xlim(0, time.time() - self.start_time)   
        # update figure canvas
        
    def draw_plot(self):
        """draw the plot"""
        self.fig.canvas.draw()
        self.fig.canvas.flush_events()
        self.frame_count += 1
        
    def stop_stream(self):
        """stop streaming audio"""
        frame_rate = self.frame_count / (time.time() - self.start_time)
        print('stream stopped')
        print('average frame rate = {:.0f} FPS'.format(frame_rate))
        
    
if __name__ == "__main__":
    pa = PitchAnalyzer()
    pa.init_plot()
    pa.start_stream()
    while True:
        pa.process_stream()
        pa.plot_data()
        try:
            pa.draw_plot()
        except TclError:
            pa.stop_stream()
            break
    
        

