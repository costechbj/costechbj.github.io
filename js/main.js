'use strict';

// Put variables in global scope to make them available to the browser console.
const URL = "https://hwcloud.ddns.net/detect/"    // 后端服务器地址

const videoElement = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
canvas.width = 817;
canvas.height = 1088;
const ctx = canvas.getContext("2d");

const videoSelect = document.querySelector('select#videoSource');
const selectors = [videoSelect];

const button = document.querySelector('button');
button.onclick = function() {
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  const dataURL = canvas.toDataURL('image/png',1.0);
  communicate(dataURL);

  /*$.ajax({
        type: "POST",
        url: "/saveimage",
        data:{
          imageBase64: dataURL
        }
      }).done(function(o) {
    window.location.href = '/process' ; */

};

/*const constraints = {
  audio: false,
  video: true
};*/

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  videoElement.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  //const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: false, //{deviceId: audioSource ? {exact: audioSource} : undefined},
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}

//audioInputSelect.onchange = start;
//audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = start;

start();


//draw boxes and labels on each detected object
function drawBoxes(objects) {

    //clear the previous drawings
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    //filter out objects that contain a class_name and then draw boxes and labels on each
    objects.filter(object => object.class_name).forEach(object => {        
        
        if (selectedObjectList == null || selectedObjectList.length == 0 || selectedObjectList.indexOf(object.class_name.toLowerCase()) > -1){
            console.log("presente")
        
            let x = object.x * drawCanvas.width;
            let y = object.y * drawCanvas.height;
            let width = (object.width * drawCanvas.width) - x;
            let height = (object.height * drawCanvas.height) - y;

            //flip the x axis if local video is mirrored
            if (mirror) {
                x = drawCanvas.width - (x + width)
            }

            drawCtx.fillText(object.class_name + " - " + Math.round(object.score * 100) + "%", x + 5, y + 20);
            drawCtx.strokeRect(x, y, width, height);
        }
    });
}
  
  
// 发送图片到服务器，并获取服务器返回的结果，显示在画布上
function communicate(img_base64_url) {
  $.ajax({ // 以AJAX方式，异步发送请求
    url: URL, // 发送给后端的地址
    type: "POST", //发送的方式
    contentType: "application/json", // 文件的类型
    data: JSON.stringify({ "image": img_base64_url }), //JSON化发送的base64图片数据
    dataType: "json", // 接受的接收图片的格式
    tryCount : 0,
    retryLimit : 2,
    timeout: 60000,
    success : function(response_data) {
      console.log("图片识别成功");
      console.log(response_data);
      drawResult(response_data.results); // 等接收到后端返回的数据后，把数据显示在图片上
    },
    error : function(xhr, textStatus, errorThrown ) {
        if (textStatus == 'timeout') {
            this.tryCount++;
            if (this.tryCount <= this.retryLimit) {
                //try again
                $.ajax(this);
                return;
            }
            alert("图片上传重传次数过多\n请刷新页面，或重新上传本地图片");            
            return;
        }
        alert("图片上传失败\n请刷新页面，或重新上传本地图片");
        if (xhr.status == 500) {
            //handle error
            console.log("图片加载失败,错误代码500")
        } else {
            //handle error
            console.log("图片加载失败,未知错误")
        }
    }
  })
  //.done(function (response_data) {
  //   drawResult(response_data.results); // 等接收到后端返回的数据后，把数据显示在图片上
  // });
}
  
// 在图片上标出结果
  const image = document.getElementById('source');

  //canvas.width = image.width;
  //canvas.height = image.height;
  //const ctx = canvas.getContext('2d');
  
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  console.log(results)

    for (let bbox  of results) { // 边框
      //bbox = bboxInfo['bbox'];

      ctx.beginPath();
      ctx.lineWidth = "1";
      ctx.strokeStyle = "#23abf2";

      ctx.rect(bbox[2], bbox[3], bbox[4] - bbox[2], bbox[5] - bbox[3]);
      ctx.stroke();
    };

    //for (let bbox of results) { // 文字
      //bbox = bboxInfo['bbox'];
      //class_name = bboxInfo['name'];
    //  const score = bbox[1];

      ctx.fillStyle = "#F23A47";
      ctx.font = "3px Arial";

   //   let content = parseFloat(score).toFixed(2);
      ctx.fillText("烟草粉螟：" + results.length + "只", 10, 30);
   // }
}
  
