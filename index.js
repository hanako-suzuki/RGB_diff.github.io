const medias = {
  audio: false,
  video: {
    // width: {
    //   min: 1280,
    //   max: 1920,
    // },
    // height: {
    //   min: 720,
    //   max: 1080,
    // },  
    facingMode: {
      exact: "environment"
    }
  }
};
const video = document.getElementById("video");
video.autoplay = true;
video.muted = true;
video.playsInline = true;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const promise = navigator.mediaDevices.getUserMedia(medias);
const textArea = document.getElementById("textArea");

let pilot_flag = 0;

// import LSD from './lsd/lsd';

promise.then(successCallback)
       .catch(errorCallback);

function successCallback(stream) {
  video.srcObject = stream;
  const FPS = 30;

  /* ここから */
  const width = canvas.width*1.5;
  const height = canvas.height*4;
  const median = height/2;

  let videoMatPre = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMatNow = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMatPrePre = new cv.Mat(height, width, cv.CV_8UC4);
  // let videoMatPre = new cv.Mat(height, width, cv.CV_8UC3);
  // let videoMatNow = new cv.Mat(height, width, cv.CV_8UC3);
  let blackAndWhiteMatPre = new cv.Mat(height, width, cv.CV_8UC1);
  let blackAndWhiteMatNow = new cv.Mat(height, width, cv.CV_8UC1);

  let videoPreview = new cv.Mat(height, width, cv.CV_8UC4);
  const box_size = 10;
  const box_size_harf = box_size/2;
  const base_x = 300;
  const base_y = 200;
  const color_num = 2;
  const image_size = color_num*box_size+box_size;
  const left_high = [new cv.Point(base_x,base_y), new cv.Point(base_x+box_size,base_y), new cv.Point(base_x+box_size,base_y+box_size), new cv.Point(base_x,base_y+box_size)];
  const right_high = [new cv.Point(base_x+image_size,base_y), new cv.Point(base_x+image_size+box_size,base_y), new cv.Point(base_x+image_size+box_size,base_y+box_size), new cv.Point(base_x+image_size,base_y+box_size)];
  const right_low =[new cv.Point(base_x+image_size,base_y+image_size), new cv.Point(base_x+image_size+box_size,base_y+image_size), new cv.Point(base_x+image_size+box_size,base_y+image_size+box_size), new cv.Point(base_x+image_size,base_y+image_size+box_size)];
  const left_low = [new cv.Point(base_x,base_y+image_size), new cv.Point(base_x+box_size,base_y+image_size), new cv.Point(base_x+box_size,base_y+image_size+box_size), new cv.Point(base_x,base_y+image_size+box_size)];
  const preview_points = [left_high, right_high, left_low, right_low];

  let posLog = []; // 0:x 1:y 2: theta 3:frequency
  const comp_length = 5;
  let colorRed = new cv.Scalar(255, 0, 0);
  let threshold_size = 5;

  let read_flag = 0;
  let H_inv;
  let sync_pannel="0";
  // const color_name = ["red", "green", "blue", "lightblue", "yellow", "navy", "purple", "orange", "white"];
  // const color_bit = ["100","011","010","110","111","000","001","101", "-1"];
  const color_name = ["red", "green", "blue", "lightblue", "white"];
  const color_bit = ["00","01","10","11","-1"];

  let connection;


  canvas.width = width;
  canvas.height = height;

  processVideo();

  function processVideo() {
    try{
      const begin = Date.now();

      // ctx.drawImage(video, 0, 0, width, height);
      ctx.drawImage(video, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
      // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // videoMatPre.copyTo(videoMatNow);
      // videoMatNow.data.set(ctx.getImageData(0, 0, width, height).data);
      videoMatNow = cv.matFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));

      // videoPreview = videoMatNow.clone();
      for(let i=0;i<4;i++){
        for(let j=0; j<4; j++){
          cv.line(videoPreview, preview_points[i][j], preview_points[i][(j+1)%4],colorRed, 1);
        }
      }
      cv.imshow("canvas",videoPreview);

      // get pilot signal
      // if(pilot_flag == 1){
      // if(read_flag>20 & pilot_flag==0){
      //   // pilot signal -Red
      //   let R_value = 0;
      //   let G_value = 0;
      //   let B_value = 0;
      //   for(let i=left_high[0].x+box_size_harf-1; i<left_high[0].x+box_size_harf+1; i++){
      //     for(let j=left_high[0].y+box_size_harf-1; j<left_high[0].y+box_size_harf+1; j++){
      //       let data = videoPreview.ucharPtr(j,i);
      //       R_value += data[0]/4;
      //       G_value += data[1]/4;
      //       B_value += data[2]/4;
      //     }
      //   }
      //   const R_pilot = [R_value, G_value, B_value];

      //   // pilot signal -Green
      //   R_value = 0;
      //   G_value = 0;
      //   B_value = 0;
      //   for(let i=right_high[0].x+box_size_harf-1; i<right_high[0].x+box_size_harf+1; i++){
      //     for(let j=right_high[0].y+box_size_harf-1; j<right_high[0].y+box_size_harf+1; j++){
      //       let data = videoPreview.ucharPtr(j,i);
      //       R_value += data[0]/4;
      //       G_value += data[1]/4;
      //       B_value += data[2]/4;
      //     }
      //   }
      //   const G_pilot = [R_value, G_value, B_value];

      //   // pilot signal -Blue
      //   R_value = 0;
      //   G_value = 0;
      //   B_value = 0;
      //   for(let i=left_low[0].x+box_size_harf-1; i<left_low[0].x+box_size_harf+1; i++){
      //     for(let j=left_low[0].y+box_size_harf-1; j<left_low[0].y+box_size_harf+1; j++){
      //       let data = videoPreview.ucharPtr(j,i);
      //       R_value += data[0]/4;
      //       G_value += data[1]/4;
      //       B_value += data[2]/4;
      //     }
      //   }
      //   const B_pilot = [R_value, G_value, B_value];

      //   textArea.innerHTML = "R: [" + String(R_pilot[0]) + ", " + String(R_pilot[1]) + ", " + String(R_pilot[2]) + "] " +
      //                        "G: [" + String(G_pilot[0]) + ", " + String(G_pilot[1]) + ", " + String(G_pilot[2]) + "] " +
      //                        "B: [" + String(B_pilot[0]) + ", " + String(B_pilot[1]) + ", " + String(B_pilot[2]) + "]";

      //   H_inv = calc_H(R_pilot, G_pilot, B_pilot);
      //   pilot_flag = 1;
      //   // read_flag = 1;
      // }

      // read color
      // if(pilot_flag==1){

      //   // check sync pannel
      //   let R_value = 0;
      //   let G_value = 0;
      //   let B_value = 0;
      //   for(let i=right_low[0].x+box_size_harf-1; i<right_low[0].x+box_size_harf+1; i++){
      //     for(let j=right_low[0].y+box_size_harf-1; j<right_low[0].y+box_size_harf+1; j++){
      //       let data = videoPreview.ucharPtr(j,i);
      //       R_value += data[0]/4;
      //       G_value += data[1]/4;
      //       B_value += data[2]/4;
      //     }
      //   }
      //   let receptColor = [R_value, G_value, B_value];
      //   let bit = demodulate_color(receptColor, H_inv);
      //   textArea.innerHTML = bit;
      //   // sync pannel red->green or green->red
      //   if( (sync_pannel=="00"&bit=="01") || (sync_pannel=="01"&bit=="00") ){
      //     // read codeword
      //     let row_start = left_high[1].x + box_size_harf;
      //     let row_end = right_high[0].x - box_size_harf;
      //     let col_high = left_high[0].y + box_size_harf;
      //     let col_low = left_low[0].y + box_size_harf;
      //     // textArea.innerHTML = "bird";
      //     for(let i=0;;i++){
      //       let tmp = row_start + box_size*i;
      //       if(tmp >= row_end){
      //         break;
      //       }
      //       let bit = get_color(videoMatNow, H_inv, tmp, col_high);
      //       if(bit != "-1"){
      //         // except white(=null)
      //         let bit_high = bit;
      //         let bit_low = get_color(videoMatNow, H_inv, tmp, col_low);
      //         if(bit_low != "-1"){
      //           let signal_y = box_size+col_high+(color_num*color_bit.indexOf(bit_high)+color_bit.indexOf(bit_low))/color_num/color_num;
      //           let signal_x = tmp;
      //           let bit_signal = get_color(videoMatNow, H_inv, signal_x, signal_y);
      //           cv.line(videoPreview, new cv.Point(signal_x-box_size_harf, signal_y-box_size_harf), new cv.Point(signal_x+box_size_harf, signal_y-box_size_harf), colorRed, 1);
      //           cv.line(videoPreview, new cv.Point(signal_x+box_size_harf, signal_y-box_size_harf), new cv.Point(signal_x+box_size_harf, signal_y+box_size_harf), colorRed, 1);
      //           cv.line(videoPreview, new cv.Point(signal_x+box_size_harf, signal_y+box_size_harf), new cv.Point(signal_x-box_size_harf, signal_y+box_size_harf), colorRed, 1);
      //           cv.line(videoPreview, new cv.Point(signal_x-box_size_harf, signal_y+box_size_harf), new cv.Point(signal_x-box_size_harf, signal_y-box_size_harf), colorRed, 1);
      //           for(let j=0;j<1000;j++){
      //             let __ = get_color(videoMatNow, H_inv, tmp, col_high);
      //           }
      //         }
      //       }

      //     }
      //   }
      //   cv.imshow("canvas",videoPreview);
      //   sync_pannel = bit;
      // }
    
      
      // 枠検出
      if(read_flag%FPS==0){
        // ２値化
        cv.cvtColor(videoMatNow, blackAndWhiteMatNow, cv.COLOR_RGB2GRAY);
        if(read_flag !=0){
          cv.cvtColor(videoMatPre, blackAndWhiteMatPre, cv.COLOR_RGB2GRAY);
          // cv.imshow("canvas", blackAndWhiteMatPre);
        }
        // cv.imshow("canvas", blackAndWhiteMatNow);

      
        if(read_flag != 0){
          // 差分取得 グレースケール
          let diffMat = new cv.Mat(height, width, cv.CV_8UC1);
          cv.absdiff(blackAndWhiteMatNow, blackAndWhiteMatPre, diffMat);
          // cv.imshow("canvas", diffMat);
          // 差分取得　カラー
          let diffMat2 = new cv.Mat(height, width, cv.CV_8UC4);
          let tmp_now = new cv.Mat(height, width, cv.CV_8UC4);
          let tmp_pre = new cv.Mat(height, width, cv.CV_8UC4);
          cv.cvtColor(videoMatNow, tmp_now, cv.COLOR_RGBA2RGB);
          cv.cvtColor(videoMatPre, tmp_pre, cv.COLOR_RGBA2RGB);
          cv.absdiff(tmp_now, tmp_pre, diffMat2);

          // 線分検出 Hough
          if(diffMat.width!=NaN){
            posLog.unshift([]); // posLogの一番最初に空の配列を追加

            let y_position = [];
            // cv.bitwise_not(diffMat, diffMat);
            cv.Canny(diffMat, diffMat, 50, 200, 3); // エッジ検出

            // 始点と終点座標var.
            let lines = new cv.Mat();
            cv.HoughLinesP(diffMat, lines, 1, Math.PI / 180, 2, 0, 0);
            // draw lines
            for (let i = 0; i < lines.rows; ++i) {
              let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
              let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);

              if(startPoint.x == endPoint.x & startPoint.y == endPoint.y){
                // 点は除去
                continue;
              }

              // 線分の角度を求める
              let theta;
              if(startPoint.x != endPoint.x){
                theta = Math.atan(Math.abs((startPoint.y-endPoint.y)/(startPoint.x-endPoint.x)));
              }
              else{
                theta = Math.PI/2;
              }
              // let tmp_theta = theta*180/Math.PI;
              if(theta<0.1745){ // if theta < 10rad
                let pushFlag = 0;

                // greenの値が大きければ差分を消す
                let tmpFlag = 0;
                for(let i=Math.min(startPoint.y, endPoint.y); i<=Math.max(startPoint.y, endPoint.y);i++){
                  let tmpR = 0;
                  let tmpG = 0;
                  let tmpB = 0;
                  for(let j=Math.min(startPoint.x, endPoint.x); j<=Math.max(startPoint.x, endPoint.x); j++){
                    let data = diffMat2.ucharPtr(j,i);
                    tmpR += data[0];
                    tmpG += data[1];
                    tmpB += data[2];
                  }
                  tmpR /= (Math.abs(startPoint.x-endPoint.x)+1);
                  tmpG /= (Math.abs(startPoint.x-endPoint.x)+1);
                  tmpB /= (Math.abs(startPoint.x-endPoint.x)+1);
                  if(200<tmpR & tmpG<50 & 200<tmpB){
                    tmpFlag = 1;
                  }
                  // tmpFlag = 1;
                }
                if(tmpFlag == 0){
                  continue;
                }

                // for(let i=1; i<posLog.length; i++){
                //   for(let j=0; j<posLog[i].length; j++){
                //     let s_x = Math.min(posLog[i][j][0].x,posLog[i][j][1].x);
                //     let s_y = posLog[i][j][0].y;
                //     let e_x = Math.max(posLog[i][j][0].x,posLog[i][j][1].x);
                //     let e_y = posLog[i][j][1].y;

                //     // if(s_x-5<startPoint.x & startPoint.x<s_x+5 & s_y-5<startPoint.y & startPoint.y<s_y+5){
                //     //   if(e_x-5<endPoint.x & endPoint.x<e_x+5 & e_y-5<endPoint.y & endPoint.y<e_y+5){
                //     //     posLog[i][j][3] += 1;
                //     //   }
                //     // }
                //     let min_x = Math.min(startPoint.x, endPoint.x);
                //     let max_x = Math.max(startPoint.x, endPoint.x);
                //     if(s_y-15<startPoint.y & startPoint.y<e_y+15){
                //       if(e_x+500<min_x || max_x+500<s_x){
                //         posLog[i][j][3] += 1;
                //         let new_x0 = Math.min(s_x, e_x, startPoint.x, endPoint.x);
                //         let new_x1 = Math.max(s_x, e_x, startPoint.x, endPoint.x);
                //         let new_y = parseInt((s_y + e_y + startPoint.y + endPoint.y)/4);
                //         if(new_y != NaN){
                //           startPoint.x = new_x0;
                //           startPoint.y = new_y;
                //           endPoint.x = new_x1;
                //           endPoint.y = new_y;
                //           posLog[i][j][0] = new cv.Point(new_x0, new_y);
                //           posLog[i][j][1] = new cv.Point(new_x1, new_y);
                //           pushFlag = 1;
                //         }
                //       }
                //     }
                //     // if(startPoint.y-5 < s_y & s_y < startPoint.y+5){
                //     //   // y座標が同じくらいなら線を結合
                //     //   let new_x0 = Math.min(s_x, e_x, startPoint.x, endPoint.x);
                //     //   let new_x1 = Math.max(s_x, e_x, startPoint.x, endPoint.x);
                //     //   let new_y = (s_y + e_y + startPoint.y + endPoint.y)/4;
                //     //   startPoint.x = new_x0;
                //     //   startPoint.y = new_y;
                //     //   endPoint.x = new_x1;
                //     //   endPoint.y = new_y;
                //     // }
                //   }
                // }
                // if(pushFlag == 0){
                //   posLog[0].push([startPoint, endPoint, theta, 0]);
                // }

                posLog[0].push([startPoint, endPoint, theta, 0]);
                
                // cv.line(videoMatPre, startPoint, endPoint, colorRed);
              }
            }
            let fuse_lines = fusion(posLog[0]);
            // let fuse_lines = posLog[0].concat();
            for(let i=0; i<fuse_lines.length; i++){
              cv.line(videoMatPre, fuse_lines[i][0], fuse_lines[i][1], colorRed);
            }
            posLog.pop();
            // if(fuse_lines.length >= 2 & read_flag >50){
            //   if(window.confirm("ショッピングページに飛びますか？")){

            //     // yes
            //     // ソケット通信
            //     connection = new WebSocket('wss://192.168.0.2:8080');
            //     // connection = new WebSocket('wss://192.168.0.223:8080');
            //     // connection = new WebSocket('wss://192.168.86.28:8080');
            //     // textArea.innerHTML = String(connection.readyState);
            //     if (connection.readyState === 1) {
            //       console.log("コネクション成功");
            //       connectiont.send("change");
            //       connection.close();
            //       window.location.href = 'https://akitohiga.github.io/DetecteMarker.github.io/?ca69121';
            //     } else {
            //       console.warn("websocket is not connected");
            //     }
            //     // //コネクションが接続された時の動き
            //     // connection.onopen = function() {
            //     //   console.log("コネクションを開始");
            //     //   connectiont.send("change");
            //     //   connection.close();
            //     //   // window.location.href = 'https://akitohiga.github.io/mac.github.io/';
            //     // };
            //     // connection.send('change');
            //     // var sendMsg = function(val) {//メッセージを送信するときのアクション
            //     //   connection.send('line.value');//ソケットに送信
            //     // };
            //     // connection.close();
            //     // macへジャンプ
            //     window.location.href = 'https://akitohiga.github.io/DetecteMarker.github.io/?ca69121';


            //     // const io = require('socket.io-client');
            //     // var socket = io.connect('http://192.168.86.23/');
            //     // socket.on('connect', function(msg) {
            //     //   console.log("connet");
            //     //   SendMsg();
            //     //   // document.getElementById("connectId").innerHTML = 
            //     //   //   "あなたの接続ID::" + socket.socket.transport.sessid;
            //     //   // document.getElementById("type").innerHTML = 
            //     //   //   "接続方式::" + socket.socket.transport.name;
            //     // });

            //     // // // メッセージを受けたとき
            //     // // socket.on('message', function(msg) {
            //     // //   // メッセージを画面に表示する
            //     // //   document.getElementById("receiveMsg").innerHTML = msg.value;
            //     // // });

            //     // // メッセージを送る
            //     // function SendMsg() {
            //     //   // var msg = document.getElementById("message").value;
            //     //   // // メッセージを発射する
            //     //   // socket.emit('message', { value: msg });
            //     //   socket.emit('change');
            //     // }
            //     // // 切断する
            //     // function DisConnect() {
            //     //   var msg = socket.socket.transport.sessid + "は切断しました。";
            //     //   // // メッセージを発射する
            //     //   // socket.emit('message', { value: msg });
            //     //   // socketを切断する
            //     //   socket.disconnect();
            //     // }


            //   }
            // }

            // if(posLog.length == comp_length){
            //   let target_lines = posLog[comp_length-1].concat();
            //   // let fuse_lines = fusion(targetLines); // 線の結合
            //   // new_lines = check_diff_color(diffMat2, targetLines);
            //   let new_lines = fusion(target_lines);
            //   // fuse_lines = fusion(fuse_lines);
            //   // fuse_lines = fusion(fuse_lines);
            //   // fuse_lines = integlate_lines(fuse_lines, threshold_size, comp_length);
            //   for(let i=0; i<new_lines.length; i++){
            //     if(new_lines[i][3] >= comp_length * 0){
            //       cv.line(videoMatPre, new_lines[i][0], new_lines[i][1], colorRed);
            //       // データ送信箇所読み取り処理

            //     }
            //   }
            //   posLog.pop(); // posLogの一番最後を削除
            // }
          }
          cv.imshow("canvas", videoMatPre);
          videoMatPrePre = videoMatPre.clone();
          videoMatPre = videoMatNow.clone();
        }
        videoMatPre = videoMatNow.clone();
      }
      // cv.line(videoMatPre, (10,10), (10, 11), (255, 0, 0), 1);
      // cv.imshow("canvas", videoMatPre);

      // キャンバス上に線を描画
      // ctx.beginPath();       // 新しいパスを開始
      // ctx.moveTo(10, 10);    // ペンを (30, 50) へ移動
      // ctx.lineTo(11, 10);  // 直線を (150, 100) へ描く
      // ctx.stroke();          // パスを描画
      
      read_flag += 1;
      
      if(read_flag>0){
        cv.imshow("canvas", videoMatPrePre);
      }
      let delay = 1000 / FPS - (Date.now() - begin);
      if(delay<0){
        delay = 0;
      }
      setTimeout(processVideo, delay);
      // processVideo();
    }catch(e){
      location.reload();
    }
  }

  function createImageData(img){
    var cv = document.createElement('canvas');

    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;

    var ct = cv.getContext('2d');

    ct.drawImage(img, 0, 0);

    var data = ct.getImageData(0, 0, cv.width, cv.height);

    return data;
  }
  function integlate_lines(bare_lines, threshold_size, comp_length){
    // 同一の直線と思われる直線を統合する

    let ori_lines = [];

    for(let i=0; i<bare_lines.length; i++){
      if(bare_lines[i][3] > comp_length*0.6){
        let integlateFlag = 0;
        for(let j=0; j<ori_lines.length; j++){
          // 2直線の始点と終点の差分d1, d2を算出して、それが共に指定距離よりも近くにあるかどうかで、同じ直線かどうかを判断
          let d1 = Math.sqrt((ori_lines[j][0].x - bare_lines[i][0].x)**2 + (ori_lines[j][0].y - bare_lines[i][0].y)**2);
          let d2 = Math.sqrt((ori_lines[j][1].x - bare_lines[i][1].x)**2 + (ori_lines[j][1].y - bare_lines[i][1].y)**2);
          if(d1<threshold_size & d2 <threshold_size){
            integlateFlag = 1;
            break
          }
        }
        if(integlateFlag == 0){
          ori_lines.push(bare_lines[i]);
        }
      }
    }

    let return_lines = [];
    for(let i=0; i<ori_lines.length; i++){
      for(let j=0; j<ori_lines.length;j++){
        if(i!=j){
          if(ori_lines[i][1]-5<ori_lines[j][1] & ori_lines[j][1]<ori_lines[i][1]+5){
            ori_lines[i][2] += 1;
          }
        }
      }
    }

    for(let i=0; i<ori_lines.length; i++){
      if(ori_lines[i][2]>0){
        return_lines.push(ori_lines[i][0]);
      }
    }

    return return_lines;
  }

  function fusion(para_lines){
    // 各直線が他の直線と重なっているかを確認し重なっていれば融合
    if(para_lines.length <1){
      return para_lines;
    }

    let fuse_lines = [];
    let fused_list = [];

    for(let i=0; i<para_lines.length; i++){
      if(fused_list.indexOf(i)>-1){
        continue;
      }
      let new_line = para_lines[i].concat();
      for(let j=0; j<para_lines.length; j++){
        if(i != j){
          let tmp = fusion_lines(new_line, para_lines[j]);
          new_line = tmp[0].concat();
          if(tmp[1]==1){
            fused_list.push(j);
          }
        }
      }
      fuse_lines.push(new_line);
    }

    // let return_lines = [];
    // for(let i=0; i<fuse_lines.length; i++){
    //   for(let j=0; j<fuse_lines.length;j++){
    //     if(i!=j){
    //       if(fuse_lines[i][1]-5<fuse_lines[j][1] & fuse_lines[j][1]<fuse_lines[i][1]+5){
    //         fuse_lines[i][2] += 1;
    //       }
    //     }
    //   }
    // }

    // for(let i=0; i<fuse_lines.length; i++){
    //   if(fuse_lines[i][2]>0){
    //     return_lines.push(fuse_lines[i][0]);
    //   }
    // }

    return fuse_lines;
  }

  function fusion_lines(lineA, lineB){
    const distance = Math.abs(lineA[0].y - lineB[0].y);
    const pA = [Math.min(lineA[0].x, lineA[1].x), Math.max(lineA[0].x, lineA[1].x)];
    const pB = [Math.min(lineB[0].x, lineB[1].x), Math.max(lineB[0].x, lineB[1].x)];
    const cnt = Math.max(lineA[3], lineB[3]);

    if(distance > 5){
      // ２つの線が十分に離れていれば終了
      return [lineA, 0];
    }
    // if(pA[0] > pB[1]+30 & pB[0] > pA[1]+30){
    //   // 重なっていなければ終了
    //   return [lineA, 0];
    // }

    let y = parseInt((lineA[0].y + lineA[1].y + lineB[0].y + lineB[1].y)/4);
    let x1 = Math.min(lineA[0].x, lineA[1].x, lineB[0].x, lineB[1].x);
    let x2 = Math.max(lineA[0].x, lineA[1].x, lineB[0].x, lineB[1].x);
    let new_line = [new cv.Point(x1, y), new cv.Point(x2, y), 0, cnt];

    return [new_line, 1];
  }

  // カラー差分から取りたい線だけ出す
  function check_diff_color(diffMatColor, lines){
    let lines_flag = [];
    let new_lines = [];
    let colorData = [];
    for(let cnt=0; cnt<lines.length; cnt++){
      lines_flag.push(0);
      let target = lines[cnt];
      const px = [Math.min(target[0].x, target[1].x), Math.max(target[0].x, target[1].x)];
      const py = target[0].y;

      // 線状の平均輝度値を取得
      let R_value = 0.0;
      let G_value = 0.0;
      let B_value = 0.0;
      for(let i=px[0]; i<=px[1]; i++){
        let data = videoMatNow.ucharPtr(j,i);
        R_value += data[0];
        G_value += data[1];
        B_value += data[2];
      }
      R_value /= (px[1]-px[0]+1);
      G_value /= (px[1]-px[0]+1);
      B_value /= (px[1]-px[0]+1);
      if(R_value>150 & G_value>150 & B_value<50){
        lines_flag[cnt] = 1;
      }
    }
    // for(let i=0; i<colorData.length; i++){
    //   if(colorData[i][0]>150 & colorData[i][1]>150 & colorData[i][2]<50){/* error          */
    //     colorData[i][3] = 1;
    //     lines_flag[cnt] = 1;
    //   }
    // }

    for(let i=lines_flag; i<lines_flag.length; i--){
      if(lines_flag[i]== 1){
        new_lines.push(lines[i]);
      }
    }

    return new_lines;
    
  }

  function color(videoMatNow, H_inv){
    const x_l = 10;
    const x_r = 11;
    const y_u = 10;
    const y_d = 11;
    const x = [0.65,  0.3,  0.15,  0.275,  0.4,   0.25,  0.4,  0.5];
    const y = [0.3,   0.6,  0.05,  0.4,    0.45,  0.2,   0.2,  0.35];
    const color_name = ["red", "green", "blue", "lightblue", "yellow", "navy", "purple", "orange"];
    const color_bit = ["100","011","010","110","111","000","001","101"];

    // 読み取り範囲の平均輝度値を取得
    let R_value = 0.0;
    let G_value = 0.0;
    let B_value = 0.0;
    for(let i=x_l; i<=x_r; i++){
      for(let j=y_u; j<=y_d; j++){
        let data = videoMatNow.ucharPtr(j,i);
        R_value += data[0]/4;
        G_value += data[1]/4;
        B_value += data[2]/4;
      }
    }

    const receptColor = [R_value, G_value, B_value];

    // チャネル補正
    const n = 3;
    let ans_sum = 0.0;
    let ans = [0.0, 0.0, 0.0];
    for(let r=0; r<n; r++){
      let sum = 0;
      for(let i=0; i<n; i++){
        sum += H_inv[r][i]*receptColor[i];
        ans_sum += H_inv[r][i]*receptColor[i];
      }
      if(sum>0){
        ans[r] = sum;
      }else{
        ans[r] = 0;
      }
    }
    for(let r=0; r<n; r++){
      if(ans_sum != 0){
        ans[r] /= ans_sum;
      }
    }
    const ans_x = 0.65*ans[0] + 0.3*ans[1] + 0.15*ans[2];
    const ans_y = 0.3*ans[0] + 0.6*ans[1] + 0.05*ans[2];

    // let color_dis = [0,0,0,0,0,0,0,0]; // 各シンボルとの距離を格納
    let tmp;
    let min_dis;
    let min_id=0;
    for(let i=0; i<8; i++){
      tmp = Math.sqrt((x[i]-ans_x)**2 + (y[i]-ans_y)**2);
      if(i==0 || tmp<min_dis){
        min_dis = tmp;
        min_id = i;
      }
    }
    const bit = color_bit[min_id];
    // 色表示
    // textArea.innerHTML = String(color[0]) + ", " + String(color[1]) + ", " + String(color[1]) + " " + color_name[min_id];
    // textArea.innerHTML = String(receptColor[0]) + ", " + String(receptColor[1]) + ", " + String(receptColor[2]) + ", " + color_name[min_id];
    return color_name;
  }

  // チャネル推定
  function demodulate_color(receptColor, H_inv){

    // const x = [0.65,  0.3,  0.15,  0.275,  0.4,   0.25,  0.4,  0.5,  0.367];
    // const y = [0.3,   0.6,  0.05,  0.4,    0.45,  0.2,   0.2,  0.35, 0.317];

    const x = [0.65,  0.3,  0.15,  0.275, 0.367];
    const y = [0.3,   0.6,  0.05,  0.4,   0.317];
    
    
    const n = 3;
    let ans_sum = 0.0;
    let ans = [0.0, 0.0, 0.0];
    for(let r=0; r<n; r++){
      let sum = 0;
      for(let i=0; i<n; i++){
        sum += H_inv[r][i]*receptColor[i];
        ans_sum += H_inv[r][i]*receptColor[i];
      }
      if(sum>0){
        ans[r] = sum;
      }else{
        ans[r] = 0;
      }
    }
    for(let r=0; r<n; r++){
      if(ans_sum != 0){
        ans[r] /= ans_sum;
      }
    }
    const ans_x = 0.65*ans[0] + 0.3*ans[1] + 0.15*ans[2];
    const ans_y = 0.3*ans[0] + 0.6*ans[1] + 0.05*ans[2];

    // let color_dis = [0,0,0,0,0,0,0,0]; // 各シンボルとの距離を格納
    let tmp;
    let min_dis;
    let min_id=0;
    for(let i=0; i<8; i++){
      tmp = Math.sqrt((x[i]-ans_x)**2 + (y[i]-ans_y)**2);
      if(i==0 || tmp<min_dis){
        min_dis = tmp;
        min_id = i;
      }
    }
    const bit = color_bit[min_id];
    // 色表示
    // textArea.innerHTML = String(color[0]) + ", " + String(color[1]) + ", " + String(color[1]) + " " + color_name[min_id];
    // textArea.innerHTML = String(receptColor[0]) + ", " + String(receptColor[1]) + ", " + String(receptColor[2]) + ", " + color_name[min_id];
    return bit;
  }

  // チャネル行列計算
  function calc_H(R_pilot, G_pilot, B_pilot){
    let H = [[R_pilot[0], G_pilot[0], B_pilot[0]], [R_pilot[1], G_pilot[1], B_pilot[1]], [R_pilot[2], G_pilot[2], B_pilot[2]]];

    // 逆行列計算
    // 掃き出し法
    let H_inv = [[1,0,0],[0,1,0],[0,0,1]];
    let buf;
    const n = 3;

    for(let i=0; i<n; i++){
      buf = 1/H[i][i];
      for(let j=0; j<n; j++){
        H[i][j] *= buf;
        H_inv[i][j] *= buf;
      }
      for(let j=0; j<n; j++){
        if(i!=j){
          buf = H[j][i];
          for(let k=0; k<n; k++){
            H[j][k] -= H[i][k]*buf;
            H_inv[j][k] -= H_inv[i][k]*buf;
          }
        }
      }
    }
    return H_inv;
  }

  // 色取得
  function get_color(videoPreview, H_inv, x_c, y_c){
    let R_value = 0;
    let G_value = 0;
    let B_value = 0;
    for(let i=x_c-1; i<x_c+1; i++){
      for(let j=y_c-1; j<y_c+1; j++){
        let data = videoPreview.ucharPtr(j,i);
        R_value += data[0]/4;
        G_value += data[1]/4;
        B_value += data[2]/4;
      }
    }
    let receptColor = [R_value, G_value, B_value];
    let bit = demodulate_color(receptColor, H_inv);
    return bit;
  }
  // connection.close()

}

function errorCallback(err) {
  alert(err);
};

function setPilot(){
  const pilotButtonB = document.getElementById("pilotButton");
  pilot_flag = 1;
}