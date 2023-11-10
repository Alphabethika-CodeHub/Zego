import Head from "next/head";
import { useEffect, useState } from "react";
import $ from "jquery";
import { generateToken04 } from "@/styles/generateToken";
import { randomID } from "@/styles/randomString";
import { useAtom, useSetAtom } from "jotai";
import { IZegoJotai, ZegoJotaiStreamID } from "@/store/store";

export default function Home() {
    const ListStreamID = useSetAtom(ZegoJotaiStreamID);
    const [value, setZegoJotaiStreamID] = useAtom(ZegoJotaiStreamID);

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

    const secrete = "e3bfabe9e7afa5dcc7d1cc8425b2944b";
    let appID = 470447629;
    let server = "wss://webliveroom470447629-api.coolzcloud.com/ws";
    let zg = null;
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

    //  Create ZegoExpressEngine
    async function createZegoExpressEngine() {
        zg = new ZegoExpressEngine(appID, server);
        setZego(zg);
        window.zg = zg;
        console.log("ZEGO ENGINEEEEEEEEEEEEEEEEEEEEE: ", zg, Zego);
    }

    function initEvent() {
        console.log("INIT EVENT");
        zg
            ? zg.on("roomStateUpdate", (roomId, state) => {
                  console.log("INITTT ROOMSTATEUPDATE");
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
              })
            : Zego.on("roomStateUpdate", (roomId, state) => {
                  console.log("INITTT ZEGO ROOMSTATEUPDATE");
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

        zg
            ? zg.on("publisherStateUpdate", (result) => {
                  console.log("INITTT PUBLISHERSTATEUPDATE");
                  if (result.state === "PUBLISHING") {
                      $("#pushlishInfo-id").text(result.StreamID);
                  } else if (result.state === "NO_PUBLISH") {
                      $("#pushlishInfo-id").text("");
                  }
              })
            : Zego.on("publisherStateUpdate", (result) => {
                  console.log("INITTT ZEGO PUBLISHERSTATEUPDATE");
                  if (result.state === "PUBLISHING") {
                      $("#pushlishInfo-id").text(result.StreamID);
                  } else if (result.state === "NO_PUBLISH") {
                      $("#pushlishInfo-id").text("");
                  }
              });

        zg
            ? zg.on("playerStateUpdate", (result) => {
                  console.log("INITTT PLAYERSTATEUPDATE");
                  if (result.state === "PLAYING") {
                      $("#playInfo-id").text(result.StreamID);
                  } else if (result.state === "NO_PLAY") {
                      $("#playInfo-id").text("");
                  }
              })
            : Zego.on("playerStateUpdate", (result) => {
                  console.log("INITTT ZEGO PLAYERSTATEUPDATE");
                  if (result.state === "PLAYING") {
                      $("#playInfo-id").text(result.StreamID);
                  } else if (result.state === "NO_PLAY") {
                      $("#playInfo-id").text("");
                  }
              });
    }

    useEffect(() => {
        createZegoExpressEngine().finally(() => {
            console.log("INIIIIIIIIITTTTTTTTTTTTTTT");
            initEvent();
        });
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

    //  Start Publishing Stream
    async function startPublishingStream(streamId, config) {
        try {
            const ls = await Zego.createZegoStream(config);
            setLocalStream(await Zego.createZegoStream(config));

            Zego.startPublishingStream(StreamID, ls, {
                videoCodec,
            });

            ls.playVideo($("#localVideo")[0], {
                mirror: true,
                objectFit: "cover",
            });
            $("#localVideo").show();

            AddSingleListStreamID(value, StreamID);
            return true;
        } catch (err) {
            return false;
        }
    }

    // Logout room
    function logoutRoom(roomId) {
        LocalStream && stopPublishingStream(StreamID);
        Zego.logoutRoom(roomId);
        clearStream();
    }

    // Stop Publishing Stream
    async function stopPublishingStream(streamId) {
        console.log("STOP PUBLISH: ", streamId);
        Zego &&
            Zego.stopPublishingStream(streamId) &&
            console.log("stopPublishingStream(streamId): ", streamId);
        clearStream();
    }

    function clearStream() {
        console.log("STREAM CLEARED: ", LocalStream);

        LocalStream && Zego.destroyStream(LocalStream);

        setLocalStream(null);
        setPublished(false);
    }

    function useVideoDevice(deviceID) {
        LocalStream && Zego.useVideoDevice(LocalStream, deviceID);
    }

    function useAudioDevice(deviceID) {
        LocalStream && Zego.useAudioDevice(LocalStream, deviceID);
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
                console.log("INI ERROR HANDLE LOGIN ROOM: ", err);
                throw err;
            }
        } else {
            setIsLogin(false);
            logoutRoom(roomID);
            $("#UserID")[0].disabled = false;
            $("#RoomID")[0].disabled = false;
        }
    }

    async function handleOnPublishRoom() {
        // if (!isLogin) return alert("should login room");

        if (!Published) {
            console.log("IFFFF PUBLISH");
            if (StreamID === undefined) alert("No Stream ID");

            const flag = await startPublishingStream(StreamID, {
                camera: {
                    video: {
                        input: CameraDevicesVal,
                    },
                    audio: {
                        input: MicrophoneDevicesVal,
                    },
                },
            });

            console.log("FLAG GGGG: ", flag);
            if (flag) {
                console.log("FLAG TRUE");
                setPublished(true);
            } else {
                setPublished(false);
                console.log("FLAG FALSE");
            }
        } else {
            console.log("ELSE PUBLISH: ", StreamID);
            stopPublishingStream(StreamID);
            setPublished(false);
            console.log("ELSE PUBLISH");
        }
    }

    function LoginPublishRoom() {
        handleOnLoginRoom()
            .then((d) => {
                console.log("THE D: ", d);
                setShowStop(true);
            })
            .finally(() => handleOnPublishRoom());
    }

    return (
        <>
            <Head>
                <title>Publishing Page</title>
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
                        console.log("Stream ID: ", StreamID, typeof StreamID)
                    }
                >
                    StreamID
                </button>
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
                                defaultValue={StreamID}
                                onChange={(e) => setStreamID(e.target.value)}
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
                    onClick={() => handleOnPublishRoom()}
                    type="button"
                    className="btn btn-primary me-3"
                >
                    Publish/stop Room
                </button>

                <button
                    className="btn btn-warning me-3"
                    onClick={() => LoginPublishRoom()}
                >
                    Login & Publish Room
                </button>

                {ShowStop ? (
                    <button
                        className="btn btn-danger"
                        onClick={() => {
                            console.log("localStream: ", LocalStream);
                            logoutRoom(RoomID);
                            stopPublishingStream(StreamID);
                        }}
                    >
                        Stop Publish
                    </button>
                ) : (
                    <></>
                )}

                <div
                    style={{
                        width: "200px",
                    }}
                    className="mt-3"
                    id="localVideo"
                ></div>
            </main>
        </>
    );
}
