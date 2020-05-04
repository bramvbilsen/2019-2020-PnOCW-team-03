import env from "../../env/env";

export function uploadMasterImgCanvas(canvas: HTMLCanvasElement) {
    return new Promise<{ imgPath: string }>((resolve, reject) => {
        canvas.toBlob((blob) => {
            const formData = new FormData();
            formData.append("image", blob, "masterImg.png");
            $.ajax({
                url: env.baseUrl + "/slaveImg",
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
