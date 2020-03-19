export enum SharedEventTypes {
    NotifyOfTypeChange = "notify-of-type-change",
    TimeSyncClient = "time-sync-client",
    TimeSyncServer = "time-sync-server",
}

export enum SlaveEventTypes {
    ChangeBackground = "change-background",
    ChangeOrientationColors = "change-orientation-colors",
    DisplayArrowUp = "display-arrow-up",
    DisplayArrowRight = "display-arrow-right",
    SetCounterEvent = "set-counter-event",
    ToggleOrientationColors = "toggle-orientation-colors",
    DisplayImage = "display-image",
    DisplayTriangulationOnSlave = "display-triangulation-on-slave",
    showAnimation = "show-animation",
    NotifyMasterThatPictureCanBeTaken = "notify-master-that-picture-can-be-taken",
    NotifyMasterThatCreeperCanStart = "notify-master-that-creeper-can-start",
    NotifyMasterThatSlaveScreenIsOn = "notify-master-that-slave-screen-is-on",
    NotifyMasterThatSlaveOrientationIsOn = "notify-master-that-slave-orientation-is-on",
    animationFinished = "animation-finished",
    linesShow = "lines-show",
    receiveCutData = "receive-cut-data",
}

export enum MasterEventTypes {
    ChangeSlaveBackgrounds = "change-slave-backgrounds",
    ChangeSlaveBackground = "change-slave-background",
    ToggleSlaveOrientationColors = "toggle-slave-orientation-colors",
    SlaveChanges = "notify-master-of-slaves",
    SendArrowsUp = "send-arrows-up",
    SendArrowsRight = "send-arrows-right",
    NotifySlavesOfStartTimeCounter = "notify-slaves-of-start-time-counter",
    DisplayImageOnSlave = "display-image-on-slave",
    SendTriangulationOnSlave = "send-triangulation-on-slave",
    GiveUpMaster = "give-up-master",
    ShowAnimationOnSlave = "show-animation-on-slave",
    HandleNextSlaveFlowHanlderStep = "handle-next-slave-flow-handler-step",
    nextLine = "next-line",
    triangulationShow = "triangulation-show",
    sendCutData = "send-cut-data",
}
