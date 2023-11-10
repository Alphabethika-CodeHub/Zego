import { atom } from "jotai";

export interface IZegoJotai {
    STREAM_ID: string[];
}

export const ZegoJotaiStreamID = atom<IZegoJotai>({
    STREAM_ID: [],
});
