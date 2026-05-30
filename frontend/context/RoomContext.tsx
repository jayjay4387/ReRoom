import { createContext, useContext, useState, ReactNode } from 'react';
import { ImagePickerAsset } from 'expo-image-picker';

type Style = 'minimal' | 'cozy' | 'modern' | 'maximalist';

type RoomContextType = {
  photo: ImagePickerAsset | null;
  setPhoto: (photo: ImagePickerAsset | null) => void;
  style: Style | null;
  setStyle: (style: Style) => void;
  chaosFrame: string | null;
  setChaosFrame: (frame: string) => void;
  finalFrame: string | null;
  setFinalFrame: (frame: string) => void;
  videoUrl: string | null;
  setVideoUrl: (url: string) => void;
  description: string | null;
  setDescription: (desc: string) => void;
  reset: () => void;
};

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [chaosFrame, setChaosFrame] = useState<string | null>(null);
  const [finalFrame, setFinalFrame] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const reset = () => {
    setPhoto(null);
    setStyle(null);
    setChaosFrame(null);
    setFinalFrame(null);
    setVideoUrl(null);
    setDescription(null);
  };

  return (
    <RoomContext.Provider
      value={{ photo, setPhoto, style, setStyle, chaosFrame, setChaosFrame, finalFrame, setFinalFrame, videoUrl, setVideoUrl, description, setDescription, reset }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside RoomProvider');
  return ctx;
}
