import Head from "next/head";
import { useEffect, useState } from "react";
import $ from "jquery";
import { generateToken04 } from "@/styles/generateToken";
import { randomID } from "@/styles/randomString";
import { useAtom, useSetAtom } from "jotai";
import { IZegoJotai, ZegoJotaiStreamID } from "@/store/store";

const MonitorPage = () => {
    const ListStreamID = useSetAtom(ZegoJotaiStreamID);
    const [value, setZegoJotaiStreamID] = useAtom(ZegoJotaiStreamID);
    const StaticListStreamID: string[] = [
        "Jius3",
        "rUVl0",
        "TBK1b",
        "Xnb5m",
        "zp9fp",
        "AgnRL",
    ];

    function AddSingleListStreamID(prevState: IZegoJotai, streamID: string) {
        if (prevState.STREAM_ID.length >= 1) {
            ListStreamID({
                STREAM_ID: [streamID, ...prevState.STREAM_ID],
            });
        } else {
            ListStreamID({
                STREAM_ID: [streamID],
            });
        }
    }

    function ResetListStreamID() {
        console.log("Resetted");
        ListStreamID({
            STREAM_ID: [],
        });
    }

    const [UserID, setUserID]: any = useState();
    const [RoomID, setRoomID]: any = useState();
    const [StreamID, setStreamID]: any = useState();

    const secrete = "47270deaf2ea66afa6e26a146ff3b4a4";
    let appID = 150245451;
    let server = "wss://webliveroom150245451-api.coolzcloud.com/ws";
    let zg = null;
    let remoteStream = null;
    let videoCodec = "H264";

    const [isLogin, setIsLogin] = useState();
    const [Zego, setZego] = useState();
    const [Published, setPublished] = useState(false);
    const [LocalStream, setLocalStream] = useState();

    const [VideoDeviceList, setVideoDeviceList] = useState();
    const [AudioDeviceList, setAudioDeviceList] = useState();
    const [MicrophoneDevicesVal, setMicrophoneDevicesVal] = useState();
    const [CameraDevicesVal, setCameraDevicesVal] = useState();
    const [CheckSystemRequireStatus, setCheckSystemRequireStatus] = useState();
    const [ShowStop, setShowStop] = useState(false);

    const [isPlaying, setIsPlaying] = useState();

    //  Create ZegoExpressEngine
    function createZegoExpressEngine() {
        zg = new ZegoExpressEngine(appID, server);
        setZego(zg);
        window.zg = Zego;
        console.log("ZEGO ENGINEEEEEEEEEEEEEEEEEEEEE: ", zg, Zego);
    }

    function initEvent() {
        console.log("INIT EVENT");
        zg.on("roomStateUpdate", (roomId, state) => {
            $("#roomInfo-id").text(roomID);
            if (state === "CONNECTED") {
                console.log(111, roomID);
                $("#roomStateSuccessSvg").css("display", "inline-block");
                $("#roomStateErrorSvg").css("display", "none");
            }

            if (state === "DISCONNECTED") {
                $("#roomStateSuccessSvg").css("display", "none");
                $("#roomStateErrorSvg").css("display", "inline-block");
            }
        });

        zg.on("publisherStateUpdate", (result) => {
            if (result.state === "PUBLISHING") {
                $("#pushlishInfo-id").text(result.StreamID);
            } else if (result.state === "NO_PUBLISH") {
                $("#pushlishInfo-id").text("");
            }
        });

        zg.on("playerStateUpdate", (result) => {
            if (result.state === "PLAYING") {
                $("#playInfo-id").text(result.StreamID);
            } else if (result.state === "NO_PLAY") {
                $("#playInfo-id").text("");
            }
        });
    }

    useEffect(() => {
        createZegoExpressEngine();
        initEvent();
    }, []);

    // Step1 Check system requirements
    async function checkSystemRequirements() {
        console.log("sdk version is", Zego.getVersion());
        try {
            const result = await Zego.checkSystemRequirements();

            console.warn("checkSystemRequirements ", result);

            if (!result.webRTC) {
                console.error("browser is not support webrtc!!");
                return false;
            } else if (!result.videoCodec.H264 && !result.videoCodec.VP8) {
                console.error("browser is not support H264 and VP8");
                return false;
            } else if (!result.camera && !result.microphone) {
                console.error("camera and microphones not allowed to use");
                return false;
            } else if (result.videoCodec.VP8) {
                if (!result.screenSharing)
                    console.warn("browser is not support screenSharing");
            } else {
                console.log("不支持VP8，请前往混流转码测试");
            }
            return true;
        } catch (err) {
            console.error("checkSystemRequirements", err);
            return false;
        }
    }

    //  Login room
    async function loginRoom(roomId, userId, userName, token) {
        return await Zego.loginRoom(roomId, token, {
            userID: userId,
            userName,
        });
    }

    async function enumDevices() {
        console.log("ENUM CHECK DEVICES");
        const deviceInfo = await Zego.enumDevices();
        const audioDeviceList =
            deviceInfo &&
            deviceInfo.microphones.map((item, index) => {
                if (!item.deviceName) {
                    item.deviceName = "microphone" + index;
                }
                console.log("MICROPPHONE: " + item.deviceName);
                return item;
            });
        audioDeviceList.push({ deviceID: 0, deviceName: "禁止" });
        const videoDeviceList =
            deviceInfo &&
            deviceInfo.cameras.map((item, index) => {
                if (!item.deviceName) {
                    item.deviceName = "camera" + index;
                }
                console.log("CAMERAAAAAAAAAAAAAA: " + item.deviceName);
                return item;
            });
        videoDeviceList.push({ deviceID: 0, deviceName: "禁止" });

        setVideoDeviceList(videoDeviceList);
        setAudioDeviceList(audioDeviceList);
        setMicrophoneDevicesVal(audioDeviceList[0].deviceID);
        setCameraDevicesVal(videoDeviceList[0].deviceID);
    }

    async function startPlayingStream(streamId: string, options = {}) {
        try {
            StaticListStreamID.map(async (id: string, index: number) => {
                remoteStream = await Zego.startPlayingStream(id, options);
                const remoteView = Zego.createRemoteStreamView(remoteStream);

                console.log("Static Stream ID: ", id, index);

                remoteView.play(`remoteVideo${index}`, {
                    objectFit: "cover",
                });

                $("#playVideo").hide();
                $(`#remoteVideo${index}`).show();
                return true;
            });
        } catch (err) {
            console.error("startPlayingStream", err);
            return false;
        }
    }

    async function stopPlayingStream(streamId, clearWay) {
        Zego.stopPlayingStream(streamId);
        clearStream(clearWay);
    }

    async function handlePlaying() {
        if (!isPlaying) {
            const flag = await startPlayingStream(StreamID);
            if (flag) {
                setIsPlaying(true);
                // $("#PlayID")[0].disabled = true;
            }
        } else {
            stopPlayingStream(StreamID, "play");
            setIsPlaying(false);
            // $("#PlayID")[0].disabled = false;
        }
    }

    // Logout room
    function logoutRoom(roomId) {
        Zego.logoutRoom(roomId);
        clearStream();
    }

    function clearStream() {
        LocalStream && Zego.destroyStream(LocalStream);

        setLocalStream(null);
        setPublished(false);
    }

    async function handleOnLoginRoom() {
        const userID = $("#UserID").val();
        const roomID = $("#RoomID").val();

        if (!userID) return alert("userID is Empty");
        if (!roomID) return alert("RoomID is Empty");

        const token = generateToken04(appID, userID, secrete, 3600, "");
        console.log("TOKEN: ", StreamID, userID, roomID, token);

        if (!isLogin) {
            try {
                setIsLogin(await loginRoom(roomID, userID, userID, token));
                console.log("IS LOGIN: ", isLogin);
                enumDevices();
                $("#UserID")[0].disabled = true;
                $("#RoomID")[0].disabled = true;
            } catch (err) {
                setIsLogin(false);
                throw err;
            }
        } else {
            setIsLogin(false);
            logoutRoom(roomID);
            $("#UserID")[0].disabled = false;
            $("#RoomID")[0].disabled = false;
        }
    }

    return (
        <>
            <Head>
                <title>Monitoring Page</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="p-3">
                <button
                    onClick={() =>
                        StreamID !== undefined &&
                        StreamID !== "" &&
                        AddSingleListStreamID(value, StreamID)
                    }
                    className="btn btn-sm btn-warning me-3"
                >
                    Add Single Stream ID
                </button>
                <button
                    onClick={() => console.log("Jotai State: ", value)}
                    className="btn btn-sm btn-warning me-3"
                >
                    Check Jotai
                </button>
                <button
                    onClick={() => ResetListStreamID()}
                    className="btn btn-sm btn-danger me-3"
                >
                    Reset Jotai
                </button>

                <hr />

                <button
                    className="btn btn-dark btn-sm mb-3"
                    onClick={() => console.log("Zegooooo: ", Zego)}
                >
                    Check Zego
                </button>

                <section>
                    <div>
                        <label className="form-label">User ID</label>
                        <div className="input-group mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="UserID"
                                defaultValue={UserID ? UserID : null}
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setUserID(randomID(5))}
                            >
                                Ran
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Room ID</label>
                        <div className="input-group mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="RoomID"
                                defaultValue={RoomID ? RoomID : "5000"}
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setRoomID(randomID(5))}
                            >
                                Ran
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Stream ID</label>
                        <div className="input-group mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="RoomID"
                                onChange={(e) => setStreamID(e.target.value)}
                                defaultValue={StreamID}
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setStreamID(randomID(5))}
                            >
                                Ran
                            </button>
                        </div>
                    </div>
                </section>

                <button
                    onClick={() => handleOnLoginRoom()}
                    type="button"
                    className="btn btn-primary me-3"
                >
                    Login/out Room
                </button>

                <button
                    onClick={() => handlePlaying()}
                    type="button"
                    className="btn btn-primary me-3"
                >
                    Show Streaming
                </button>

                <div className="row row-cols-3 gap-3 ">
                    {StaticListStreamID.map((it, index) => {
                        return (
                            <div
                                style={{
                                    width: "350px",
                                }}
                                className="mt-3 col-4 "
                                id={`remoteVideo${index}`}
                            ></div>
                        );
                    })}
                </div>
            </main>
        </>
    );
};

export default MonitorPage;
