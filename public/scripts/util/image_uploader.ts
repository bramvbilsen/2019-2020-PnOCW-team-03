export function uploadSlaveImgCanvas(
    slaveId: string,
    canvas: HTMLCanvasElement
) {
    return new Promise<{ imgPath: string }>((resolve, reject) => {
        canvas.toBlob(blob => {
            const formData = new FormData();
            formData.append("image", blob, `${slaveId}.png`);
            formData.append("slaveId", slaveId);
            $.ajax({
                url: "http://localhost:3000/slaveImg",
                type: "POST",
                contentType: false,
                cache: false,
                processData: false,
                data: formData,
                success: (data: any) => {
                    console.log("Success: " + data);
                    resolve(data);
                },
                error: () => {
                    console.log("ERROR UPLOADING IMAGE");
                    reject();
                },
            });
        });
    });
}
