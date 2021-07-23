const CON_ERROR = can_error.getContext("2d");
const CON_MAIN  = can_main.getContext("2d");
const CON_FLAG  = can_flag.getContext("2d");
const CON_LOG   = can_log.getContext("2d");
const MAP_ALL  = "map.1_";
const MAP_CTRL = "map.1_c";
const MAP_FLAG = "map.1_f_";
const MAP_HEAD = "map.1_h_";
const MAP_LOG  = "map.1_l_";
// 変換
class classConvert {
    set(left,right,bottom,top,width,height){
        this.left   = Number(left);
        this.right  = Number(right);
        this.bottom = Number(bottom);
        this.top    = Number(top);
        this.width  = Number(width);
        this.height = Number(height);
        return ""; 
    }
    // 経度-->width 変換
    long_px(long) {
        return Math.round(this.width * (long - this.left) / (this.right - this.left));
    }
    // width-->経度 変換
    px_long(x) {
        return Math.round((this.left + (this.right - this.left) * x / this.width) * 1000000) / 1000000;
    }
    // 緯度-->height 変換
    lat_py(lat) {
        return Math.round(this.height * (lat - this.bottom) / (this.top - this.bottom));
    }
    // height-->緯度 変換
    py_lat(y) {
        return Math.round((this.top + (this.bottom - this.top) * y / this.height) * 1000000) / 1000000;
    }
}
// フラグ
class classFlag {
    constructor() {
        this.px;    // 丸位置 x
        this.py;    // 丸位置 y
        this.tx;    // 文字位置 x
        this.ty;    // 文字位置 y
        this.color; // 色
        this.text;  // 文字
    }
}
// 現在地
class classGenzai {
    constructor() {
        this.a;     // 高度
        this.h;     // 方角
        this.s;     // 速度
        this.long;  // 経度
        this.lat;   // 緯度
        this.x;     // x
        this.y;     // y    
        this.m = "";// 現在地取得メッセージ
    }
}
// head内容
class classHead {
    constructor() {
        this.key;
        this.value;
        this.id="";
        this.name;
        this.nameEx;
        this.left;
        this.right;
        this.bottom;
        this.top;
        this.width;
        this.height;
        this.img;
        this.logCount;
        this.flagCount;
    };
}
// ログ
class classLog {
    constructor() {
        this.md;    // 月日
        this.hm;    // 時分
        this.long;  // 経度
        this.lat;   // 緯度
        this.x;     // x
        this.y;     // y
        this.dir; 　// 吹出方向,t:上,b:下,l:左,r:右,無指定:右
    }
}
// Text処理
class classText {
    // 保存
    save(file,key,text) {
        let str = "data:text/csv;charset=utf-8,";   // 出力方法追加
        for (let i = 0; i < key.length; i++) str += `${key[i]}\t${text[i]}\n`;
        let uri = encodeURI(str);                   // エンコード化
        let ele = document.createElement("a");      // a要素作成
        ele.setAttribute("href", uri);              // a要素に出力データ追加
        ele.setAttribute("download",`${file}.txt`); // a要素に出力情報追加
        ele.style.visibility = "hidden";            // 非表示
        document.body.appendChild(ele);             // コントロール追加
        ele.click();                                // クリックイベント発生
        document.body.removeChild(ele);             // コントロール削除
    }
}
// 機能:地図・データ切替
a_kno.addEventListener("click",() => {
    if (a_kno.innerHTML == "地図") {
        a_kno.innerHTML = "data";
        sel_ope.value = "";
        screen_disp(11);
    } else {
        a_kno.innerHTML = "地図";
        screen_disp(1);
    }
});
// 機能:現在地、記録開始
a_kno_log.addEventListener("click",() => {
    if (con_timerF) {
        // on --> off    
        clearInterval(con_timerId);
        con_timerF = false;
        a_kno_log.innerHTML = "未録";
        info_disp("記録停止");    
    } else if (con_file == "") {
        // off --> on 警告
        alert("地図未選択");
        return;
    } else {
        // off --> on
        con_timerId = setInterval(gen_get,1000); // 1秒
        con_first = true;
        con_timerF = true;
        a_kno_log.innerHTML = `記録間隔:${Number(con_timerG)}秒`;
        info_disp("記録開始");        
    }      
});
// 地図File選択用
a_map_file.addEventListener("click",() => {
    if (con_timerF) {
        alert("記録中は地図の選択不可");
        return;
    }
    in_map_file.click();
});
// 地図File選択
in_map_file.addEventListener('change',(e) => {
    if (e.target.files.length == 0) return;
    // ファイルのブラウザ上でのURLを取得する
    let file = e.target.files[0];
    let file_url = window.URL.createObjectURL(file);
    let file_name = file.name.replace(".png","");
    in_map_text.value = file_name;
    // option削除
    let sel = sel_map_ex.options;
    for (let i = sel.length - 1; i > -1; i--) {
        if (!sel[i].selectid) sel_map_ex.removeChild(sel[i]);
    }
    // 地図情報検索
    con_file = "";
    for (let i = 0; i < headA.length; i++) {
        if (headA[i].name == file_name) {
            con_file = file_name;
            let opt = document.createElement("option");
            opt.text = headA[i].nameEx;
            opt.value = i;
            sel_map_ex.appendChild(opt);
        }
    }
    // 地図未登録
    if (con_file == "") {
        alert(`地図未登録:${file_name}`);
        return;
    }
    // 最後を選択
    sel_map_ex.options[sel_map_ex.length - 1].selected = true;
    head = headA[sel_map_ex.value];
    // 地図登録済
    image.src = file_url;
    image.onload = () => {
        head.img = image;
        head.width = image.width;
        head.height = image.height;
        // 地図情報セット
        can_main.width   = image.width;
        can_main.height  = image.height;
        can_flag.width   = image.width;
        can_flag.height  = image.height;
        can_log.width    = image.width;
        can_log.height   = image.height;
        can_error.width  = 400;
        can_error.height = 200;
        conv.set(head.left,head.right,head.bottom,head.top,head.width,head.height);
    }
});
// 同じ地図の別のグループ
sel_map_ex.addEventListener("change",() => {
    head = headA[sel_map_ex.value];
    head.img = image;
    head.width = image.width;
    head.height = image.height;
});
// 地図位置表示
a_map_pos.addEventListener("click",() => {
    if (a_map_pos.innerHTML == "位Ｘ") {
        a_map_pos.innerHTML = "位置";
    } else {
        a_map_pos.innerHTML = "位Ｘ";
    }
});
// 地図表示
a_map_disp.addEventListener("click",() => {
    if (in_map_text.value == "") {
        alert("地図未選択");
        return;
    }
    // 消去・地図表示
    CON_MAIN.clearRect(0,0,can_main.width, can_main.height);
    CON_FLAG.clearRect(0,0,can_main.width, can_main.height);
    CON_LOG.clearRect(0,0,can_main.width, can_main.height);
    CON_MAIN.drawImage(head.img,0,0);
    // off --> on flag,log 配列作成
    flagT = [];
    logT  = [];
    let strFlag = MAP_FLAG + head.id;
    let strLog = MAP_LOG + head.id
    for (let i = 0; i < localStorage.length; i++) {
        let x = localStorage.key(i);
        if (x.substr(0,10) == strFlag) flagT.push(x);
        if (x.substr(0,10) == strLog) logT.push(x);
    }
    // flag 配列作成
    flagT.sort();
    flagA = [];
    for (item of flagT) {
        let val = localStorage.getItem(item);
        let v   = val.split(/\s+/); // 連続する空白で分割
        if (v.length == 6) {
            c_flag       = new classFlag;
            c_flag.px    = v[0];
            c_flag.py    = v[1];
            c_flag.tx    = change_pos_text(v[0],v[2]);
            c_flag.ty    = change_pos_text(v[1],v[3]);
            c_flag.color = v[4];
            c_flag.text  = v[5];
            flagA.push(c_flag);
        }
    }
    // flag 描画
    for (item of flagA) con_blow(CON_FLAG,item.px,item.py,item.tx,item.ty,item.color,item.text);
    // log 描画
    logT.sort();
    for (item of logT) {
        let k    = item.split("_");
        let val  = localStorage.getItem(item);
        let v    = val.split(/\s+/); // 連続する空白で分割
        let dir  = "r";
        if (v.length == 3) dir = v[2];
        con_log(CON_LOG,k[4],v[0],v[1],dir);
    }
    screen_disp(8);
});
// 保存データ
in_save_file.addEventListener('change',(e) => {
    if (e.target.files.length == 0) return;
    // ファイルのブラウザ上でのURLを取得する
    let file = e.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsText(file);
    // ファイル読込終了後
    fileReader.onload = () => {
        key_all = [];
        val_all = [];        
        let strs = fileReader.result.split("\n");
        for (str of strs) {
            let text = str.split("\t");
            if (text.length == 2) {
                key_all.push(text[0]);
                val_all.push(text[1]);
                tbody_append(tbo_all,text[0],text[1]);
            }
        }
    }
});
// 操作変更
sel_ope.addEventListener("change",() => {
    switch (sel_ope.value) {
        // 全表示
        case "dispAll":
            tbody_detete(tbo_all);
            screen_disp(22);
            tbo_all_disp();
            break;
        // 選択表示
        case "dispSel":
            screen_disp(12);
            sel_ope_key_disp();     
            break;
        // 集計表示
        case "dispSumm":
            tbody_detete(tbo_summ);
            screen_disp(24);
            tbo_summ_disp();    
            break;
        // 全保存
        case "saveAll":
            tbody_detete(tbo_all);
            screen_disp(81);
            tbo_all_disp();
            break;
        // 選択保存
        case "saveSel":
            screen_disp(12);
            sel_ope_key_disp();
            break;
        // 管理データ追加
        case "addKan":
            // 管理データ
            let kan = [
                ["map.1_c",false,"0002 0600"],
                ["map.1_h_xa_sample-a",false,"135.000000 140.000000 30.000000 40.000000"],
                ["map.1_h_xb_sample-b",false,"140.000000 145.000000 40.000000 50.000000"],
            ];
            // 登録済データ確認
            for (let i = 0; i < localStorage.length; i++) {
                let key = localStorage.key(i);
                for (let j = 0; j < kan.length; j++) {
                    if (kan[j][0] == key ) {
                        kan[j][1] = true; 
                    } else if (kan[j][0] == key.substr(0,kan[j][0].length)) kan[j][1] = true; 
                }
            }
            // 行削除
            tbody_detete(tbo_all);
            // 未登録データ表示
            key_all = [];
            val_all = [];
            for (let i = 0; i < kan.length; i++) {
                if (kan[i][1] == false) {
                    key_all.push(kan[i][0]);
                    val_all.push(kan[i][2]);
                    tbody_append(tbo_all,kan[i][0],kan[i][2]);
                } 
            }
            // 未登録データ追加
            if (key_all.length == 0) {
                alert("追加データ無し");
                screen_disp(11);         
            } else {
                screen_disp(81);
            }
            break;
        // 保存データ追加
        case "addFile":
            in_save_file.click();
            // 行削除
            tbody_detete(tbo_all);
            screen_disp(81);
            break;
        // 選択削除
        case "delSel":
            screen_disp(12);
            sel_ope_key_disp();
            break;
    }        
});
// 選択変更
sel_ope_key.addEventListener("change",() => {
    switch (sel_ope.value) {
        // 選択表示
        case "dispSel":
            screen_disp(23);
            tbody_detete(tbo_head);
            tbody_detete(tbo_log);
            tbody_detete(tbo_flag);
            tbo_head_flag_log_disp();
            break;
        // 選択保存
        case "saveSel":
            screen_disp(82);
            tbody_detete(tbo_head);
            tbody_detete(tbo_log);
            tbody_detete(tbo_flag);
            tbo_head_flag_log_disp();
            break;
        // 選択削除
        case "delSel":
            screen_disp(82);
            tbody_detete(tbo_head);
            tbody_detete(tbo_log);
            tbody_detete(tbo_flag);
            tbo_head_flag_log_disp();
            break;
    }
});
// 実行
a_ope_exe.addEventListener("click",() => {
    switch (sel_ope.value) {
        // 全保存
        case "saveAll":
            key_all = [];
            val_all = [];
            for (let i = 0; i < localStorage.length; i++) key_all.push(localStorage.key(i));
            key_all.sort()
            for (let i = 0; i < key_all.length; i++) val_all.push(localStorage.getItem(key_all[i]));
            text.save("map_all",key_all,val_all);
            break;
        // 選択保存
        case "saveSel":
            id = sel_ope_key.value.substr(8,2); 
            key_all = [];
            val_all = [];
            // 登録データ取得
            for (let i = 0; i < localStorage.length; i++) {
                let k = localStorage.key(i);
                if (k.substr(0,6) == MAP_ALL && k.substr(8,2) == id) key_all.push(k);
            }
            key_all.sort()
            for (item of key_all) {
                let val = localStorage.getItem(item);
                val_all.push(val);
            }
            let idx = sel_ope_key.selectedIndex;
            let txt  = sel_ope_key.options[idx].text;
            text.save(txt,key_all,val_all);
            break;      
        // 管理データ追加
        case "addKan":
            // 未登録データ追加
            for (let i = 0; i < key_all.length; i++) localStorage.setItem(key_all[i],val_all[i]);
            screen_disp(11);
            sel_ope.value = "";
            break;        
        // 保存データ追加
        case "addFile":
            for (let i = 0; i < key_all.length; i++) localStorage.setItem(key_all[i],val_all[i]);
            screen_disp(11);
            sel_ope.value = "";
            break;
        // 選択削除   
        case "delSel":
            // 削除 flag log
            for (item of flagT) localStorage.removeItem(item);
            for (item of logT) localStorage.removeItem(item);
            screen_disp(11);
            sel_ope.value = "";
            break;
    }        
});
// 追加
a_act_ins.addEventListener("click",() => {
    let key = in_act_key.value;
    let val = in_act_val.value;
    let rtn = confirm(`追加 キー:${key},内容:${val}`);
    if (rtn) localStorage.setItem(key,val);
    // 更新後表示
    if (sel_ope.value == "dispAll") {
        tbody_detete(tbo_all);    
        tbo_all_disp();
    } else {
        tbody_detete(tbo_head);
        tbody_detete(tbo_flag);    
        tbody_detete(tbo_log);
        tbo_head_flag_log_disp();
    }
});
// 修正
a_act_upd.addEventListener("click",() => {
    let key = in_act_key.value;
    let val = in_act_val.value;
    let rtn = confirm(`修正 キー:${key},内容:${val}`);
    if (rtn) {
        localStorage.removeItem(key_save);
        localStorage.setItem(key,val);
    }
    // 更新後表示
    if (sel_ope.value == "dispAll") {
        tbody_detete(tbo_all);  
        tbo_all_disp();
    } else {
        tbody_detete(tbo_head);
        tbody_detete(tbo_flag);
        tbody_detete(tbo_log);
        tbo_head_flag_log_disp();
    }
});
// 削除
a_act_del.addEventListener("click",() => {
    let key = in_act_key.value;
    let val = in_act_val.value;
    let rtn = confirm(`削除 キー:${key},内容:${val}`);
    if (rtn) {localStorage.removeItem(key)}
    // 更新後表示
    if (sel_ope.value == "dispAll") {
        tbody_detete(tbo_all);  
        tbo_all_disp();
    } else {
        tbody_detete(tbo_head);
        tbody_detete(tbo_flag);    
        tbody_detete(tbo_log);
        tbo_head_flag_log_disp();
    }
});
// マウス押下
can_log.addEventListener('mousedown',(e) =>{
    click_start = new Date();
    click_pos_disp(e);
});
// マウスup
can_log.addEventListener("mouseup",() => { 
    let click_end = new Date()
    let ms = click_end.getTime() - click_start.getTime();
    if (ms > con_long) screen_disp(1);
});
// タッチtart
can_log.addEventListener("touchstart",(e) => {
    // 3本指タッチは戻る
    if (e.targetTouches.length > 2) screen_disp(1);  
    click_start = new Date();
    click_pos_disp(e);
});
// タッチend
can_log.addEventListener("touchend",() => {
    let click_end = new Date();
    let ms = click_end.getTime() - click_start.getTime();
    if (ms > con_long) screen_disp(1);    
});
// ロード時
window.onload = () => {
    screen_disp(1);
    // control 取得
    let ctrl = -1;   
    for (let i = 0; i < localStorage.length; i++) {
        let x = localStorage.key(i);
        if (x.substr(0,7) == MAP_CTRL) {
            ctrl = i;
            break;
        }
    }
    //  control 有無確認 
    if (ctrl != -1) {
        let str = localStorage.getItem(MAP_CTRL);
        con_long = str.substr(0,4) * 1000;
        con_timerG = str.substr(5,4);
        }
    // headA 作成
    headA_set();
    if (!navigator.geolocation) info_disp("navigator.geolocation 位置情報取得 不可");
}
// 丸
function con_arc(con,x,y,radius,color) {
    con.beginPath();
    con.strokeStyle = color;
    con.lineWidth = 3;
    con.arc(x,y,radius,0,Math.PI*2,true);
    con.stroke();
}
// 四角形
function con_box(con,x,y,w,h,color,text) {
    let colorX     = "black";
    let background = "white";
    let line       = "black";
    switch (color) {
        case "green":
            colorX     = color;
            background = "rgb(222,248,220)";
            line       = "lightgreen";
            break;
        case "red":
            colorX     = color;
            background = "rgb(255,192,203)";
            line       = "fuchsia";
            break;
        case "blue":
            colorX     = color;
            background = "rgb(224,255,255)";
            line       = "aqua";
    }
    con.beginPath(); 
    con.fillStyle = line; 
    con.fillRect(x,y,w,h);
    con.fillStyle = background;
    con.fillRect(x+3 , y+3, w-6, h-6);
    con.fillStyle = colorX;
    con.font      = "14px 'ＭＳ ゴシック'";
    con.fillText(text,x+12,y+25);
}
// 吹出
function con_blow(con,px,py,tx,ty,color,text) {
    con.font = "20px 'UD デジタル 教科書体 NP-B'";
    let len = con.measureText(text);    // 幅測定
    // 丸作成
    con.beginPath();
    con.strokeStyle = color;            // 線の色
    con.fillStyle = color;              // 塗りつぶし色
    con.arc(px,py,5,0,Math.PI*2,true);
    con.fill();                         // 塗りつぶし
    con.stroke();
    // 四角形作成
    con.beginPath();
    con.lineWidth = 2;    
    con.fillStyle = color;
    con.strokeRect(tx-5,ty-12,len.width+10,25);
    // 文字列描画
    con.fillText(text,tx,ty+8);
    // 直線作成
    con.beginPath();
    con.lineWidth = 2;
    con.strokeStyle = color;
    con.moveTo(px,py);
    con.lineTo(tx-5,ty);
    con.stroke();
}
// 吹出 log
function con_log(con,hm,long,lat,dir) {
    // 色の選択
    let color; 
    if      (hm < "0600") {color = "black"}
    else if (hm < "0900") {color = "green"}
    else if (hm < "1200") {color = "orange"}
    else if (hm < "1800") {color = "red"}
    else                  {color = "blue"}
    // 箱・線の位置
    let text = `${hm.substr(0,2)}:${hm.substr(2,2)}`;
    let bx;                         // 箱・左上x
    let by;                         // 箱・左上y
    let bh = 22;                    // 箱・高
    let bw = 74;                    // 箱・幅
    let lx;                         // 線・終端x
    let ly;                         // 線・終端y
    let llx = 80;                   // 線・長x
    let lly = 20;                   // 線・長y 
    let px = conv.long_px(long);    // 丸x
    let py = conv.lat_py(lat);      // 丸y
    // 吹出(log)方向での箱・線の位置 
    switch (dir) {
        case "t":
            // 上
            bx = px - bw / 2;
            by = py - lly - bh;
            lx = px;
            ly = py - lly;
            break;
        case "b":
            // 下
            bx = px - bw / 2;
            by = py + lly;
            lx = px;
            ly = py + lly;
            break;
        case "l":
            // 左
            bx = px - llx - bw;
            by = py - bh / 2;
            lx = px - llx;
            ly = py;
            break;
        default:
            // 右
            bx = px + llx;
            by = py - bh / 2; // 上に
            lx = px + llx;
            ly = py;
    }
    con.font = "20px 'UD デジタル 教科書体 NP-B'";
    // 丸作成
    con.beginPath();
    con.strokeStyle = color;            // 線の色
    con.fillStyle = color;              // 塗りつぶし色
    con.arc(px,py,5,0,Math.PI*2,true);
    con.fill();                         // 塗りつぶし
    con.stroke();
    // 四角形作成
    con.beginPath();
    con.lineWidth = 2;    
    con.fillStyle = color;
    con.strokeRect(bx,by,bw,bh);
    // 文字列描画
    con.fillText(text,bx+5,by+19);
    // 直線作成
    con.beginPath();
    con.lineWidth = 2;
    con.strokeStyle = color;
    con.moveTo(px,py);
    con.lineTo(lx,ly);
    con.stroke();
}
// 現在地取得
function gen_get() {navigator.geolocation.getCurrentPosition(gen_ok,gen_err,gen_opt)}
// 現在地取得成功
function gen_ok(gen) {
    gen_first();
    genzai.a    = gen.coords.altitude; // 高度
    genzai.h    = gen.coords.heading;  // 方角
    genzai.s    = gen.coords.speed;    // 速度
    genzai.long = Math.round(gen.coords.longitude * 1000000) / 1000000; // 経度
    genzai.lat  = Math.round(gen.coords.latitude * 1000000) / 1000000;  // 緯度
    genzai.x    = conv.long_px(genzai.long);
    genzai.y    = conv.lat_py(genzai.lat);
    genzai.m    = "";                  // 現在地取得メッセージ
    info_disp(`経度:${genzai.long} 緯度:${genzai.lat}`);
    // 日付取得
    let dt = new Date();
    let mm = ("00" + (dt.getMonth()+1)).slice(-2);
    let dd = ("00" +  dt.getDate()).slice(-2);
    let HH = ("00" + (dt.getHours())).slice(-2);
    let MM = ("00" + (dt.getMinutes())).slice(-2);
    // log追加
    log.md   = mm + dd;
    log.hm   = HH + MM;
    log.long = genzai.long;
    log.lat  = genzai.lat;
    log.x    = genzai.x;
    log.y    = genzai.y;
    logA.push(log);
    let key  = `${MAP_LOG}${head.id}_${mm}${dd}_${HH}${MM}`;
    let val  = `${genzai.long} ${genzai.lat}`;
    localStorage.setItem(key,val);
    con_log(CON_LOG,log.hm,log.long,log.lat,"r");
    CON_ERROR.clearRect(0,0,can_error.width, can_error.height);
}
// 現在地取得失敗
function gen_err(err){
    gen_first();
	let gen_mess = {
		0: "原因不明のエラー",
		1: "位置情報の取得不許可",
		2: "位置情報の取得不可",
		3: "位置情報の取得タイムアウト",
	} ;
	genzai.m = gen_mess[err.code];
    info_disp(genzai.m);
    con_box(CON_ERROR,1,1,200,40,"red",genzai.m);     
}
// オプション・オブジェクト
let gen_opt = {
	"enableHighAccuracy": false,
	"timeout": 8000,
	"maximumAge": 5000,
}
// 1回目
function gen_first() {
    if (!con_first) return;
    // on --> off    
    clearInterval(con_timerId);
    // off --> on
    con_first = false;
    con_timerId = setInterval(gen_get,con_timerG * 1000); // 秒→ミリ秒
}
// デバッグ現在地
function gen_debug() {
    // 経度 表示
    let text = `経度:${genzai.long} (${head.left} ${head.right})`;
    // 経度チェック
    if (genzai.long < head.left || genzai.long > head.right) {text += "範囲外"}
    // 緯度 表示
    text += `\n緯度: ${genzai.lat} ( ${head.bottom}  ${head.top})`;
    // 緯度チェック
    if (genzai.lat < head.bottom || genzai.lat > head.top) {text += "範囲外"}
    // 高度・方角・速度 表示
    if (genzai.a != null) {text += `\n高度:${genzai.a} m`}
    if (genzai.h != null) {text += `\n方角:${genzai.h}`}
    if (genzai.s != null) {text += `\n速度:${genzai.s} m/s`}
    // ピクセルに変換
    text += `\ngenX=${genzai.x},genY=${genzai.x}`;
    // 表示
    console.log(text);
}
// headA 作成
function headA_set() {
    headA = [];
    key_all = []; 
    for (let i = 0; i < localStorage.length; i++) {
        let x = localStorage.key(i);
        if (x.substr(0,8) == MAP_HEAD) key_all.push(x);
    }
    key_all.sort();
    for (item of key_all) {
        let k   = item.split("_");
        let val = localStorage.getItem(item);
        let v   = val.split(/\s+/); // 連続する空白で分割
        if (k.length == 4 && k[3] != "" && v.length == 4) {
            head           = new classHead;
            head.key       = item;
            head.value     = val;
            head.id        = k[2];
            head.left      = v[0];
            head.right     = v[1];
            head.bottom    = v[2];
            head.top       = v[3];
            head.width     = 0;
            head.height    = 0;
            head.logCount  = 0;
            head.flagCount = 0;
            head.name      = k[3];
            head.nameEx    = k[3];
            headA.push(head);
        } else if (k.length == 5 && k[3] != "" && k[4] != "" && v.length == 4) {
            head           = new classHead;
            head.key       = item;
            head.value     = val;
            head.id        = k[2];
            head.left      = v[0];
            head.right     = v[1];
            head.bottom    = v[2];
            head.top       = v[3];
            head.width     = 0;
            head.height    = 0;
            head.logCount  = 0;
            head.flagCount = 0;            
            head.name      = k[3];
            head.nameEx    = `${k[3]}_${k[4]}`;
            headA.push(head);
        }
    }
}
// info 表示
function info_disp(info) {
    if (info == info_save && info_cnt < 9) {
        info_cnt++;
        pre_info.innerHTML = pre_info.innerHTML.substring(0,pre_info.innerHTML.length - 1) + "↑\n";
    } else {
        let dt = new Date();
        let HH = ("00" + (dt.getHours())).slice(-2);
        let MM = ("00" + (dt.getMinutes())).slice(-2);
        pre_info.innerHTML += `${HH}:${MM} ${info}\n`;
        info_cnt = 0;
        info_save = info;
    }
}
// flag 吹出の丸→文字位置計算
function change_pos_text(pos,text) {
    if (text == "=") return Number(pos);
    if (text == "+") return Number(pos) + 50;
    if (text == "-") return Number(pos) - 50;
    return Number(pos) + Number(text);
}
// クリック位置表示
function click_pos_disp(e) {
    if (a_map_pos.innerHTML == "位置") {
        let long = conv.px_long(e.offsetX);
        let lat = conv.py_lat(e.offsetY);
        let str = `位置 X=${e.offsetX},Y=${e.offsetY},経度=${long},緯度=${lat}`;
        if (e.offsetX < can_main.width - 400) {
            con_box(CON_FLAG,e.offsetX,e.offsetY,400,40,"green",str);
        } else {
            con_box(CON_FLAG,e.offsetX - 400,e.offsetY,400,40,"green",str);
        }
    con_arc(CON_FLAG,e.offsetX,e.offsetY,1,"blabk"); 
    }
}
// 表示
function screen_disp(screen) {
    // 機能選択                    k c m o 2 3 k v a h f l s
    if (screen == 1)  {screen_sub(1,0,1,0,0,0,0,0,0,0,0,0,0)}
    // 地図選択    
    if (screen == 8)  {screen_sub(0,1,0,0,0,0,0,0,0,0,0,0,0)}
    // データ操作   
    if (screen == 11) {screen_sub(1,0,0,1,0,0,0,0,0,0,0,0,0)}
    // 選択表示
    if (screen == 12) {screen_sub(1,0,0,1,2,0,0,0,0,0,0,0,0)}
    // 全データ表示
    if (screen == 22) {screen_sub(1,0,0,1,0,0,1,1,1,0,0,0,0)}
    // 選択表示
    if (screen == 23) {screen_sub(1,0,0,1,2,0,1,1,0,1,1,1,0)}
    // 集計表示
    if (screen == 24) {screen_sub(1,0,0,1,0,0,0,0,0,0,0,0,1)}
    // 選択追加  
    if (screen == 80) {screen_sub(1,0,0,1,0,2,0,0,0,0,0,0,0)}
    // 管理追加・全保存   
    if (screen == 81) {screen_sub(1,0,0,1,0,2,0,0,1,0,0,0,0)}
    // 選択保存   
    if (screen == 82) {screen_sub(1,0,0,1,2,2,0,0,0,1,1,1,0)}
}
// 表示sub
function screen_sub(kno,can,map,ope,ope2,ope3,key,val,all,head,flag,log,summ) {
    let x = {0:"none",1:"block",2:"inline",7:"hidden",8:"visible"}
    div_kno.style.display     = x[kno];
    div_can.style.display     = x[can];
    div_map.style.display     = x[map];
    div_ope.style.display     = x[ope];
    a_ope_key.style.display   = x[ope2];
    sel_ope_key.style.display = x[ope2];
    a_ope_exe.style.display   = x[ope3];
    div_act1.style.display    = x[key];
    div_act2.style.display    = x[val];
    div_all.style.display     = x[all];
    div_head.style.display    = x[head];
    div_flag.style.display    = x[flag];
    div_log.style.display     = x[log];
    div_summ.style.display    = x[summ];
}
// sel_ope_key 表示
function sel_ope_key_disp() {
    // 登録データ取得 head
    key_all = [];    
    for (let i = 0; i < localStorage.length; i++) {
        let temp = localStorage.key(i);
        if (temp.substr(0,8) == MAP_HEAD) key_all.push(temp);
    }
    key_all.sort();
    // option削除
    let sel = sel_ope_key.options;
    for (let i = sel.length - 1; i > -1; i--) {
        if (!sel[i].selectid) sel_ope_key.removeChild(sel[i]);
    }
    // option追加         
    for (item of key_all) {
        let k   = item.split("_");
        let opt = document.createElement("option");
        if (k.length == 4 && k[3] != "")  {
            opt.text = k[3];
        } else if (k.length > 4 && k[3] != "" && k[4] != "") {
            opt.text = `${k[3]}_${k[4]}`;
        } else {
            opt.text = item;           
        }
        opt.value = item;
        sel_ope_key.appendChild(opt);
    }
    sel_ope_key.value = "";
}
// tbo_all 表示
function tbo_all_disp() {
    // 登録データ取得
    key_all = [];
    for (let i = 0; i < localStorage.length; i++) key_all.push(localStorage.key(i));    
    key_all.sort();
    // 行追加
    for (item of key_all) tbody_append(tbo_all,item,localStorage.getItem(item));
    // onclick イベント追加
    for (let r = 0; r < tbo_all.rows.length; r++) {
        for (let c = 0; c < tbo_all.rows[r].cells.length; c++) {
            let rc = tbo_all.rows[r].cells[c];
            rc.onclick = function() {tbo_all_click(this)}
        }
    }
    in_act_key.value = "";
    in_act_val.value = "";    
}
// tbo_all クリック
function tbo_all_click(x) {
    let r = x.parentNode.rowIndex - 1;
    in_act_key.value = tbo_all.rows[r].cells[0].innerHTML;
    in_act_val.value = tbo_all.rows[r].cells[1].innerHTML;
    key_save = in_act_key.value;
    val_save = in_act_val.value;    
}
// tbo_summ 表示
function tbo_summ_disp() {
    // headA 作成
    headA_set();
    // flag,log 取得
    flagA = [];
    logA = [];
    for (let i = 0; i < localStorage.length; i++) {
        let x = localStorage.key(i);
        if (x.substr(0,8) == MAP_FLAG) {
            flagA.push(x);
        } else if (x.substr(0,8) == MAP_LOG) {
            logA.push(x);
        }
    }
    // flag 集計
    for (flag of flagA) {
        let id = flag.substr(8,2);
        for (let i = 0; i < headA.length; i++) {
            if (id == headA[i].id) {
                headA[i].flagCount++;
                break;
            } 
        }
    }
    // log 集計
    for (log of logA) {
        let id = log.substr(8,2);
        for (let i = 0; i < headA.length; i++) {
            if (id == headA[i].id) {
                headA[i].logCount++;
                break;
            } 
        }
    }
    // 表示 
    for (head of headA) tbody_append(tbo_summ,head.key,`${head.logCount} , ${head.flagCount}`);
}
// tbo_head, tbo_log 表示
function tbo_head_flag_log_disp() {
    // head,flag,log 取得
    headT = [];
    flagT = [];
    logT = [];
    let strHead = MAP_HEAD + sel_ope_key.value.substr(8,2);    
    let strFlag = MAP_FLAG + sel_ope_key.value.substr(8,2);
    let strLog = MAP_LOG + sel_ope_key.value.substr(8,2);
    for (let i = 0; i < localStorage.length; i++) {
        let x = localStorage.key(i);
        switch (x.substr(0,10)) {
            case strFlag:
                flagT.push(x);
                break;
            case strHead:
                headT.push(x);
                break;
            case strLog:
                logT.push(x);
        }
    }
    // 行追加 head
    headT.sort();
    for (item of headT) tbody_append(tbo_head,item,localStorage.getItem(item));
    // onclick イベント追加 flag
    for (let r = 0; r < tbo_head.rows.length; r++) {
        for (let c = 0; c < tbo_head.rows[r].cells.length; c++) {
            let rc = tbo_head.rows[r].cells[c];
            rc.onclick = function() {tbo_head_click(this)}
        }
    }
    // 行追加 flag
    flagT.sort();
    for (item of flagT) tbody_append(tbo_flag,item,localStorage.getItem(item));
    // onclick イベント追加 flag
    for (let r = 0; r < tbo_flag.rows.length; r++) {
        for (let c = 0; c < tbo_flag.rows[r].cells.length; c++) {
            let rc = tbo_flag.rows[r].cells[c];
            rc.onclick = function() {tbo_flag_click(this)}
        }
    }
    // 行追加 log
    logT.sort();
    for (item of logT) tbody_append(tbo_log,item,localStorage.getItem(item));
    // onclick イベント追加 log
    for (let r = 0; r < tbo_log.rows.length; r++) {
        for (let c = 0; c < tbo_log.rows[r].cells.length; c++) {
            let rc = tbo_log.rows[r].cells[c];
            rc.onclick = function() {tbo_log_click(this)}
        }
    }
    in_act_key.value = "";
    in_act_val.value = "";    
}
// tbo_head クリック
function tbo_head_click(x) {
    let r = x.parentNode.rowIndex - 1;
    in_act_key.value = tbo_head.rows[r].cells[0].innerHTML;
    in_act_val.value = tbo_head.rows[r].cells[1].innerHTML;
    key_save = in_act_key.value;
    val_save = in_act_val.value;        
}
// tbo_flag クリック
function tbo_flag_click(x) {
    let r = x.parentNode.rowIndex - 1;
    in_act_key.value = tbo_flag.rows[r].cells[0].innerHTML;
    in_act_val.value = tbo_flag.rows[r].cells[1].innerHTML;
    key_save = in_act_key.value;
    val_save = in_act_val.value;    
}
// tbo_log クリック
function tbo_log_click(x) {
    let r = x.parentNode.rowIndex - 1;
    in_act_key.value = tbo_log.rows[r].cells[0].innerHTML;
    in_act_val.value = tbo_log.rows[r].cells[1].innerHTML;
    key_save = in_act_key.value;
    val_save = in_act_val.value;    
}
// tbody行追加
function tbody_append(ctrl,key,value) {
    let row = ctrl.insertRow();
    let cell = row.insertCell();
    let k = document.createTextNode(key);
    let v = document.createTextNode(value);
    cell.appendChild(k);
    cell = row.insertCell();
    cell.appendChild(v);
}
// tbody行削除
function tbody_detete(ctrl) {
    for (let i = ctrl.rows.length - 1; i > -1; i--) ctrl.deleteRow(i);    
};          
// 開始
let conv      = new classConvert;
let c_flag    = new classFlag;
let genzai    = new classGenzai;
let image     = new Image;
let log       = new classLog;
let head      = new classHead;
let text      = new classText;
let can_rect  = can_main.getBoundingClientRect();
let click_start;        // クリック開始時間
let con_file  = "";     // 地図file名
let con_long  = 2;      // 長押し(2秒)
let con_first           // true:1回目 false:2回目以降
let con_timerId;        // タイマーid
let con_timerF = false; // タイマー起動状態
let con_timerG = 600;   // 現在地取得間隔(600秒)
let flagA;              // flag Array
let flagT;              // flag Array
let headA;              // head Array
let headT;              // head Array
let logA;               // log Array
let logT;               // log Array
let info_cnt  = 0;
let info_save = "";
let key_all;
let key_save;
let scale_pos;
let val_all;
let val_save;
