import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AudioPlayerState {
  isPlayingAudio: boolean;
}

const initialState: AudioPlayerState = {
  isPlayingAudio: false,
};

export const audioPlayerSlice = createSlice({
  name: "audioPlayer",
  initialState,
  reducers: {
    setPlayingAudio: (state, action: PayloadAction<boolean>) => {
      state.isPlayingAudio = action.payload;
    },
  },
});

export const { setPlayingAudio } = audioPlayerSlice.actions;

export default audioPlayerSlice.reducer;
