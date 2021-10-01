const CON_ERROR = can_error.getContext("2d");
const CON_MAIN  = can_main.getContext("2d");
const CON_FLAG  = can_flag.getContext("2d");
const CON_LOG   = can_log.getContext("2d");
const CON_FONT  = "20px 'UD デジタル 教科書体 NP-B'";
const MAP_ALL   = "map.1_";
const MAP_CTRL  = "map.1_c";
const MAP_FLAG  = "map.1_f_";
const MAP_HEAD  = "map.1_h_";
const MAP_LOG   = "map.1_l_";
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
        return Math.round(this.height * (this.top - lat) / (this.top - this.bottom));
    }
    // height-->緯度 変換
    py_lat(y) {
        return Math.round((this.top + (this.bottom - this.top) * y / this.height) * 1000000) / 1000000;
    }
}
// フラグ
class classFlag {
    constructor() {
        this.value; // そのまま
        this.px;    // 丸位置 x
        this.py;    // 丸位置 y
        this.tx;    // 文字位置 x
        this.ty;    // 文字位置 y
        this.color; // 色
        this.text;  // 文字
    }
    // セット
    set(txt) {
        this.value = txt;
        let v = txt.split(/\s+/); // 連続する空白で分割
        if (v.length < 4) {
            this.px    = 100;
            this.py    = 300;
            this.tx    = 150;
            this.ty    = 350;
            this.color = "red";
            this.text  = `項目不足:${txt}`;
        } else if (v.length == 4) { 
            this.px    = v[0];
            this.py    = v[1];
            this.pos_color(v[2]);
            this.text  = v[3];
        } else {
            this.px    = v[0];
            this.py    = v[1];
            this.pos_color(v[2]);
            this.text = txt.replace(v[0],"").replace(v[1],"").replace(v[2],"").trim();
        }
    }
    // 位置・色
    pos_color(str) {
        // 色検出
        this.color = "black";
        let colorA = {
            a: "aqua",
		    b: "blue",
		    f: "fuchsia",
		    g: "green",
            l: "lime",
		    m: "maroon",
            o: "olive",
            p: "purple",
            r: "red",
            t: "teal",
            y: "yellow",
        }
        let strX = str;
        for (let i = 0; i < str.length; i++) {
            let s = str.substr(i,1);
            if (s in colorA) {
                this.color = colorA[s];
                strX.replace(s,"");
            }
        }
        // 吹出位置
        this.tx = this.px;
        this.ty = this.py;
        for (let i = 0; i < strX.length; i++) {    
            let s = strX.substr(i,1);
            if (s == "n") this.ty = Number(this.ty) - 50;
            if (s == "s") this.ty = Number(this.ty) + 50;
            if (s == "w") this.tx = Number(this.tx) - 50;
            if (s == "e") this.tx = Number(this.tx) + 50;
        }
    }
    // 吹出 flag 描画
    display(con,px,py,tx,ty,color,text) {
        con.font = CON_FONT;
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
        con.fillText(text,tx,Number(ty)+8);
        // 直線作成
        con.beginPath();
        con.lineWidth = 2;
        con.strokeStyle = color;
        con.moveTo(px,py);
        con.lineTo(tx-5,ty);
        con.stroke();
    }
}
// 現在地
class classGenzai {
    constructor() {
        this.a;             // 現在地 高度
        this.h;             // 現在地 方角
        this.s;             // 現在地 速度
        this.long;          // 現在地 経度
        this.lat;           // 現在地 緯度
        this.x;             // 現在地 x
        this.y;             // 現在地 y    
        this.m = "";        // 現在地取得メッセージ
        this.adjDt;         // 調整位置取得、日付時間
        this.adjF = false;  // 調整設定      true:済   false:未
        this.adjL = false;  // 調整 log 出力 true:必要 false:不要
        this.adjX = 0;      // 調整 x
        this.adjY = 0;      // 調整 y
    }
    // セット
    set(gen) {
        this.a    = gen.coords.altitude;
        this.h    = gen.coords.heading;
        this.s    = gen.coords.speed;
        this.long = Math.round(gen.coords.longitude * 1000000) / 1000000;
        this.lat  = Math.round(gen.coords.latitude * 1000000) / 1000000;
        this.x    = cConv.long_px(this.long);
        this.y    = cConv.lat_py(this.lat);
        this.m    = "";
    }
    // セット adjusr
    adjust(flag,log,x,y) {
        this.adjDt = new Date();
        this.adjF  = flag;
        this.adjL  = log;
        this.adjX  = x;
        this.adjY  = y;  
    }
    // 現在地 描画
    display(con,px,py,color,mess) {
        let x = Math.min(Math.max(0,px),can_main.width);
        let y = Math.min(Math.max(0,py),can_main.height);
        let background = "white";
        switch (color) {
            case "green":
                background = "rgb(222,248,220)";
                break;
            case "red":
                background = "rgb(255,192,203)";
                break;
            case "blue":
                background = "rgb(224,255,255)";
        }
        let messA = {
            1: "クリックにて現在地の変更",
            2: "GPS位置",
            3: "調整後の現在地"
        }
        let text = messA[mess];
        con.font = CON_FONT;
        let len = con.measureText(text);    // 幅測定
        // 丸
        con.beginPath();
        con.arc(x,y,15,0,Math.PI*2,true);
        con.fillStyle = background;
        con.fill();
        con.strokeStyle = color;
        con.lineWidth = 2;
        con.stroke();
        // 丸
        con.beginPath();
        con.arc(x,y,10,0,Math.PI*2,true);
        con.fill();
        con.stroke();
        // 丸
        con.beginPath();
        con.arc(x,y,5,0,Math.PI*2,true);
        con.fill();
        con.stroke();
        // 四角形作成
        con.beginPath();
        con.lineWidth = 2; 
        con.fillRect(x-50,y+30,len.width+20,50);
        con.strokeRect(x-50,y+30,len.width+20,50);
        // 文字列描画
        con.fillStyle = color;
        con.fillText(text,x-40,y+60);
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
        this.logCount;
        this.flagCount;
    };
    // セット
    set(key,value,id,name,nameEx,left,right,bottom,top) {
        this.key        = key;
        this.value      = value;
        this.id         = id;
        this.name       = name;
        this.nameEx     = nameEx;
        this.left       = left;
        this.right      = right;
        this.bottom     = bottom;
        this.top        = top;
        this.logCount   = 0;
        this.flagCount  = 0;
    }
}
// ログ
class classLog {
    constructor() {
        this.md;    // 月日
        this.hm;    // 時分
        this.long;  // 経度
        this.lat;   // 緯度
        this.x;     // 調整 x
        this.y;     // 調整 y
        this.dir; 　// 吹出方向,e:東,w:西,s:南,n:北,無指定:東
    }
    // セット
    set(key,value,ax,ay) {
        let k = key.split("_");
        let v = value.split(/\s+/); // 連続する空白で分割
        this.md   = k[3];
        this.hm   = k[4].substr(0,4);
        this.long = v[0];
        this.lat  = v[1];
        if (k[4].substr(4,1) == "a") {
            this.x = v[2];
            this.y = v[3];
        } else {
            this.x = ax;
            this.y = ay;            
        }
        if (v.length == 3) {
            this.dir = v[2];
        } else {
            this.dir = "e";
        }
    }
    // 吹出 log 描画
    display(con,lr,md,hm,long,ax,lat,ay,dir) {
        // 色の選択
        let color; 
        if      (hm < "0600") {color = "black"}
        else if (hm < "0900") {color = "blue"}
        else if (hm < "1500") {color = "green"}
        else if (hm < "1800") {color = "blue"}
        else                  {color = "black"}
        // 箱・線の位置
        let text = `${hm.substr(0,2)}:${hm.substr(2,2)}`;
        let bx;         // 箱・左上x
        let by;         // 箱・左上y
        let bh = 22;    // 箱・高
        let bw = 74;    // 箱・幅
        let lx;         // 線・終端x
        let ly;         // 線・終端y
        let llx = 50;   // 線・長x
        let lly = 20;   // 線・長y 
        let px = cConv.long_px(long) + Number(ax);  // 丸x
        let py = cConv.lat_py(lat) + Number(ay);    // 丸y
        // 吹出(log)方向での箱・線の位置 
        switch (dir) {
            case "n":
                // 北
                bx = px - bw / 2;
                by = py - lly - bh;
                lx = px;
                ly = py - lly;
                break;
            case "s":
                // 南
                bx = px - bw / 2;
                by = py + lly;
                lx = px;
                ly = py + lly;
                break;
            case "w":
                // 西
                bx = px - llx - bw;
                by = py - bh / 2;
                lx = px - llx;
                ly = py;
                break;
            default:
                // 東
                bx = px + llx;
                by = py - bh / 2; // 上に
                lx = px + llx;
                ly = py;
        }
        con.font = CON_FONT;
        // 丸作成
        con.beginPath();
        con.strokeStyle = color;            // 線の色
        con.fillStyle = color;              // 塗りつぶし色
        con.arc(px,py,5,0,Math.PI*2,true);
        con.fill();                         // 塗りつぶし
        con.stroke();
        // 吹出必要判定
        let draw = false;
        let minute = hm.substr(0,2) * 60 + Number(hm.substr(2,2));
        switch (lr) {
            // log
            case "l":
                draw = true;
                break;
            // 経路
            case "r":
                if (draw_f) {
                    draw_f = false;
                    draw_md = md;
                    draw_minute = minute + 10;  // 次は10分後
                    draw = true;
                } else if (md != draw_md) {
                    draw_md = md;
                    draw_minute = minute + 10;
                    draw = true;
                } else if (minute >= draw_minute) {
                    draw_minute = minute + 10;             
                    draw = true;
                }
                break;                
        }
        // 吹出作成
        if (draw) {
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
    }
    // 時分を分に換算
    minute(hm) {
        return hm.substr(0,2) * 60 + hm.substr(2,2);
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
// click
can_log.addEventListener("click",(e) => {
    // mouse click 位置
    mouseUpX = e.offsetX;
    mouseUpY = e.offsetY;
    if (can_mode == 2) {
        // flag配列チェック
        flagApos = -1;
        for (let i = 0; i < flagA.length; i++) {
            let x = Math.abs(mouseUpX - flagA[i].px);
            let y = Math.abs(mouseUpY - flagA[i].py);
            if (x < 10 && y < 10) flagApos = i;
        }
        // Flag設定
        if (flagApos == -1) {
            con_arc(CON_FLAG,mouseUpX,mouseUpY,5,"green");
            div_ctrl.style.left = mouseUpX - 60 + "px";
            div_ctrl.style.top  = mouseUpY + 20 + "px";
            div_ctrl.style.display = "block";
            in_ctrl_text.value = `${mouseUpX} ${mouseUpY} seg Memo`;
            in_ctrl_ins.style.display = "block";
            in_ctrl_upd.style.display = "none";
            in_ctrl_del.style.display = "none";
        } else {
            div_ctrl.style.left = mouseUpX - 60 + "px";
            div_ctrl.style.top  = mouseUpY + 20 + "px";
            div_ctrl.style.display = "block";
            in_ctrl_text.value = flagA[flagApos].value;
            in_ctrl_ins.style.display = "inline";
            in_ctrl_upd.style.display = "inline";
            in_ctrl_del.style.display = "inline";
        }
        return;
    }
    if (can_mode == 3) {
        // 位置計測、表示
        let long = cConv.px_long(mouseUpX);
        let lat = cConv.py_lat(mouseUpY);
        let str = `位置 X=${mouseUpX},Y=${mouseUpY},経度=${long},緯度=${lat}`;
        if (mouseUpX < can_main.width - 400) {
            con_box(CON_FLAG,mouseUpX,mouseUpY,400,40,"green",str);
        } else {
            con_box(CON_FLAG,mouseUpX - 400,mouseUpY,400,40,"green",str);
        }
        con_arc(CON_FLAG,mouseUpX,mouseUpY,1,"black"); 
    }
});
// マウスdown
can_log.addEventListener('mousedown',(e) => mouse_down(e,"m"));
// マウスup
can_log.addEventListener('mouseup',(e) => mouse_up(e.offsetX,e.offsetY));
// タッチstart
can_log.addEventListener("touchstart",(e) => mouse_down(e,"t"));
// タッチend
can_log.addEventListener("touchend",(e) => {
    let obj = e.changedTouches[0];
    mouse_up(obj.pageX,obj.pageY);
});
// 機能選択
sel_a.addEventListener("change",() => {
    switch (sel_a.value) {
        // 地図選択
        case "aMap":
            if (con_timerF) {
                alert("記録中は地図の選択不可");
                return;
            }
            in_map_file.click();
            break;
        // 現在地設定
        case "aGen":
            if (con_file == "") {
                alert("地図未選択");
                return;
            }
            // 消去・地図表示
            con_clear();
            screen_disp(8);
            if (cGen.adjF) {
                // 取得済処理
                CON_FLAG.clearRect(0,0,can_main.width, can_main.height);
                cGen.display(CON_FLAG,cGen.x + cGen.adjX,cGen.y + cGen.adjY,"green",1);
            } else {
                // 未取得処理
                navigator.geolocation.getCurrentPosition(gen_ok_a,gen_err,gen_opt);
            }
            can_mode = 1;
            break;
        // 地図表示
        case "aDisp":
        // 経路表示
        case "aRoute":
            if (con_file == "") {
                alert("地図未選択");
                return;
            }
            if (!cGen.adjF) {
                alert("現在地未設定");
                return;
            }
            // 消去・地図表示
            con_clear();
            // flag 描画
            storage_get();
            for (item of flagA) cFlag.display(CON_FLAG,item.px,item.py,item.tx,item.ty,item.color,item.text);
            if (sel_a.value == "aDisp") {
                // log 描画
                draw_f = true;
                for (item of logA) cLog.display(CON_LOG,"l",item.md,item.hm,item.long,item.x,item.lat,item.y,item.dir);
                can_mode = 5;            
            } else {
                // route 描画
                draw_f = true;
                for (item of logA) cLog.display(CON_LOG,"r",item.md,item.hm,item.long,item.x,item.lat,item.y,item.dir);
                can_mode = 6;
            }
            screen_disp(8);
            break;
        // Flag設定
        case "aFlag":
            if (con_file == "") {
                alert("地図未選択");
                return;
            }
            // 消去・地図表示
            con_clear();
            // flag 描画            
            storage_get();
            for (item of flagA) cFlag.display(CON_FLAG,item.px,item.py,item.tx,item.ty,item.color,item.text);
            screen_disp(8);
            can_mode = 2;       
            break;
        // 位置計測
        case "aPos":
            if (con_file == "") {
                alert("地図未選択");
                return;
            }
            // 消去・地図表示
            con_clear();
            screen_disp(8);
            can_mode = 3;
            break;
        // 記録開始
        case "aStart":
            if (con_timerF) {
                alert("記録中");
                return;
            }
            if (con_file == "") {
                alert("地図未選択");
                return;
            }
            if (!cGen.adjF) {
                alert("現在地未設定");
                return;
            }
            con_timerF = true;
            screen_rec();
            // 現在地取得
            navigator.geolocation.getCurrentPosition(gen_ok_l,gen_err,gen_opt);
            con_timerId = setInterval(gen_get,con_timerG * 1000); // 秒→ミリ秒
            break;
        // 記録停止
        case "aStop":
            if (con_timerF) { 
                clearInterval(con_timerId);
                con_timerF = false;
                screen_rec();
            }
            break;
        // Data処理
        case "aData":
            sel_data.value = "";
            screen_disp(11);
            break;
    }        
});
// Data処理
sel_data.addEventListener("change",() => {
    switch (sel_data.value) {
        // 全表示
        case "dispAll":
            tbody_detete(tbo_all);
            screen_disp(22);
            tbo_all_disp();
            break;
        // 選択表示
        case "dispSel":
            screen_disp(12);
            sel_c_disp();     
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
            sel_c_disp();
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
            in_data_file.click();
            // 行削除
            tbody_detete(tbo_all);
            screen_disp(81);
            break;
        // 選択削除
        case "delSel":
            screen_disp(12);
            sel_c_disp();
            break;
    }        
});
// 選択変更
sel_c.addEventListener("change",() => {
    switch (sel_data.value) {
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
            screen_disp(83);
            tbody_detete(tbo_head);
            tbody_detete(tbo_log);
            tbody_detete(tbo_flag);
            tbo_head_flag_log_disp();
            break;
    }
});
// 追加
in_act_ins.addEventListener("click",() => {
    let key = in_act_key.value;
    let val = in_act_val.value;
    let rtn = confirm(`追加 キー:${key},内容:${val}`);
    if (rtn) localStorage.setItem(key,val);
    // 更新後表示
    if (sel_data.value == "dispAll") {
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
in_act_upd.addEventListener("click",() => {
    let key = in_act_key.value;
    let val = in_act_val.value;
    let rtn = confirm(`修正 キー:${key},内容:${val}`);
    if (rtn) {
        localStorage.removeItem(key_save);
        localStorage.setItem(key,val);
    }
    // 更新後表示
    if (sel_data.value == "dispAll") {
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
in_act_del.addEventListener("click",() => {
    let key = in_act_key.value;
    let val = in_act_val.value;
    let rtn = confirm(`削除 キー:${key},内容:${val}`);
    if (rtn) {localStorage.removeItem(key)}
    // 更新後表示
    if (sel_data.value == "dispAll") {
        tbody_detete(tbo_all);  
        tbo_all_disp();
    } else {
        tbody_detete(tbo_head);
        tbody_detete(tbo_flag);    
        tbody_detete(tbo_log);
        tbo_head_flag_log_disp();
    }
});
// flag追加
in_ctrl_ins.addEventListener("click",() => {
    // 追加no検索
    let free = 0;
    for (let i = 0; i < flagT.length; i++) {
        if (flagT[i].slice(-2) != i + 1) {
            free = i + 1;
            break;
        }
    }
    if (free == 0) free = flagT.length + 1;
    // 追加    
    let no  = (`00${free}`).slice(-2);
    let key = `${MAP_FLAG}${cHead.id}_${no}`;
    localStorage.setItem(key,in_ctrl_text.value);
    // 再表示
    CON_FLAG.clearRect(0,0,can_main.width, can_main.height);    
    storage_get();
    for (item of flagA) cFlag.display(CON_FLAG,item.px,item.py,item.tx,item.ty,item.color,item.text);
    div_ctrl.style.display = "none";
});
// flag修正
in_ctrl_upd.addEventListener("click",() => {
    localStorage.setItem(flagT[flagApos],in_ctrl_text.value);
    // 再表示
    CON_FLAG.clearRect(0,0,can_main.width, can_main.height);    
    storage_get();
    for (item of flagA) cFlag.display(CON_FLAG,item.px,item.py,item.tx,item.ty,item.color,item.text);
    div_ctrl.style.display = "none";
});
// flag削除
in_ctrl_del.addEventListener("click",() => {
    localStorage.removeItem(flagT[flagApos]);
    // 再表示
    CON_FLAG.clearRect(0,0,can_main.width, can_main.height);    
    storage_get();
    for (item of flagA) cFlag.display(CON_FLAG,item.px,item.py,item.tx,item.ty,item.color,item.text);
    div_ctrl.style.display = "none";
});
// 実行
in_data_exe.addEventListener("click",() => {
    switch (sel_data.value) {
        // 全保存
        case "saveAll":
            key_all = [];
            val_all = [];
            for (let i = 0; i < localStorage.length; i++) key_all.push(localStorage.key(i));
            key_all.sort()
            for (let i = 0; i < key_all.length; i++) val_all.push(localStorage.getItem(key_all[i]));
            cText.save("map_all",key_all,val_all);
            break;
        // 選択保存
        case "saveSel":
            id = sel_c.value.substr(8,2); 
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
            let idx = sel_c.selectedIndex;
            let txt  = sel_c.options[idx].text;
            cText.save(txt,key_all,val_all);
            break;      
        // 管理データ追加
        case "addKan":
            // 未登録データ追加
            for (let i = 0; i < key_all.length; i++) localStorage.setItem(key_all[i],val_all[i]);
            screen_disp(11);
            sel_data.value = "";
            break;        
        // 保存データ追加
        case "addFile":
            for (let i = 0; i < key_all.length; i++) localStorage.setItem(key_all[i],val_all[i]);
            screen_disp(11);
            sel_data.value = "";
            break;
    }        
});
// 選択削除 flag
in_data_flag.addEventListener("click",() => {
    for (item of flagT) localStorage.removeItem(item);
    tbody_detete(tbo_head);
    tbody_detete(tbo_log);
    tbody_detete(tbo_flag);
    tbo_head_flag_log_disp();
});
// 選択削除 log
in_data_log.addEventListener("click",() => {
    for (item of logT) localStorage.removeItem(item);
    tbody_detete(tbo_head);
    tbody_detete(tbo_log);
    tbody_detete(tbo_flag);
    tbo_head_flag_log_disp();
});
// 保存データ
in_data_file.addEventListener('change',(e) => {
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
// 記録 n
in_data_n.addEventListener('click',() => {
    con_timerF = true;
    screen_rec();
    // 現在地取得
    navigator.geolocation.getCurrentPosition(gen_ok_l,gen_err,gen_opt);
    con_timerId = setInterval(gen_get,con_timerG * 1000); // 秒→ミリ秒 
});
// 記録 y
in_data_y.addEventListener('click',() => {
    con_timerF = false;
    screen_rec();
    clearInterval(con_timerId);
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
    // info 初期化
    info_cnt = 0;
    info_save = "";
    pre_info.innerHTML = "";
    // 現在地を未設定
    con_posF  = false;
    // 調整を未設定
    cGen.adjust(false,false,0,0);
    // 最後を選択
    sel_map_ex.options[sel_map_ex.length - 1].selected = true;
    cHead = headA[sel_map_ex.value];
    // 地図読込  
    cImage.src = file_url;
    cImage.onload = () => {
        // 地図情報セット
        can_main.width   = cImage.width;
        can_main.height  = cImage.height;
        can_flag.width   = cImage.width;
        can_flag.height  = cImage.height;
        can_log.width    = cImage.width;
        can_log.height   = cImage.height;
        can_error.width  = 400;
        can_error.height = 200;
        cConv.set(cHead.left,cHead.right,cHead.bottom,cHead.top,cImage.width,cImage.height);
        // 現在地設定へ
        sel_a.value = "aGen";
        // 消去・地図表示
        con_clear();
        screen_disp(8);
        // 未取得処理
        navigator.geolocation.getCurrentPosition(gen_ok_a,gen_err,gen_opt);
        can_mode = 1;
    }
});
// 同じ地図の別のグループ
sel_map_ex.addEventListener("change",() => cHead = headA[sel_map_ex.value]);
// ロード時
window.onload = () => {
    sel_a.value = "";
    screen_disp(1);
    screen_rec();
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
// 消去
function con_clear() {
    CON_MAIN.clearRect(0,0,can_main.width, can_main.height);
    CON_FLAG.clearRect(0,0,can_main.width, can_main.height);
    CON_LOG.clearRect(0,0,can_main.width, can_main.height);
    CON_MAIN.drawImage(cImage,0,0);
}
// 丸
function con_arc(con,x,y,radius,color) {
    con.beginPath();
    con.strokeStyle = color;
    con.fillStyle = color;
    con.arc(x,y,radius,0,Math.PI*2,true);
    con.fill();
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
// 現在地取得
function gen_get() {navigator.geolocation.getCurrentPosition(gen_ok_l,gen_err,gen_opt)}
// 現在地設定成功 1回目
function gen_ok_a(gen) {
    cGen.set(gen);
    cGen.adjust(true,true,0,0);
    cGen.display(CON_FLAG,cGen.x,cGen.y,"red",2);
}
// 現在地取得処理
function gen_ok_b(gen) {
    CON_FLAG.clearRect(0,0,can_main.width, can_main.height);
    cGen.set(gen);
    cGen.adjust(true,true,mouseUpX - cGen.x,mouseUpY - cGen.y);
    cGen.display(CON_FLAG,cGen.x,cGen.y,"red",2);
    cGen.display(CON_FLAG,cGen.x + cGen.adjX,cGen.y + cGen.adjY,"green",3);
}
// 現在地取得成功
function gen_ok_l(gen) {
    cGen.set(gen);
    if (cGen.adjL) {
        // 設定地 log 出力
        info_disp(`設定:${cGen.long} ${cGen.lat} ${cGen.adjX} ${cGen.adjY}`);
        storage_log(MAP_LOG,cHead.id,cGen.adjDt,"a",cGen.long,cGen.lat,`${cGen.adjX} ${cGen.adjY}`);
        cGen.adjL = false;
    }
    // 現在地 log 出力
    let dt = new Date();
    info_disp(`現在:${cGen.long} ${cGen.lat}`);
    storage_log(MAP_LOG,cHead.id,dt,"g",cGen.long,cGen.lat,"");
    CON_ERROR.clearRect(0,0,can_error.width,can_error.height);
}
// 現在地取得失敗
function gen_err(err){
	let gen_mess = {
		0: "原因不明のエラー",
		1: "位置情報の取得不許可",
		2: "位置情報の取得不可",
		3: "位置情報の取得タイムアウト",
	} ;
	cGen.m = gen_mess[err.code];
    info_disp(cGen.m);
    con_box(CON_ERROR,1,1,200,40,"red",cGen.m);     
}
// オプション・オブジェクト
let gen_opt = {
	"enableHighAccuracy": false,
	"timeout": 8000,
	"maximumAge": 5000,
}
// デバッグ現在地
function gen_debug() {
    // 経度 表示
    let text = `経度:${cGen.long} (${cHead.left} ${cHead.right})`;
    // 経度チェック
    if (cGen.long < cHead.left || cGen.long > cHead.right) {text += "範囲外"}
    // 緯度 表示
    text += `\n緯度: ${cGen.lat} ( ${cHead.bottom}  ${cHead.top})`;
    // 緯度チェック
    if (cGen.lat < cHead.bottom || cGen.lat > cHead.top) {text += "範囲外"}
    // 高度・方角・速度 表示
    if (cGen.a != null) {text += `\n高度:${cGen.a} m`}
    if (cGen.h != null) {text += `\n方角:${cGen.h}`}
    if (cGen.s != null) {text += `\n速度:${cGen.s} m/s`}
    // ピクセルに変換
    text += `\ngenX=${cGen.x},genY=${cGen.x}`;
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
            xHead = new classHead;
            xHead.set(item,val,k[2],k[3],k[3],v[0],v[1],v[2],v[3]);
            headA.push(xHead);
        } else if (k.length == 5 && k[3] != "" && k[4] != "" && v.length == 4) {
            xHead = new classHead;
            xHead.set(item,val,k[2],k[3],`${k[3]}_${k[4]}`,v[0],v[1],v[2],v[3]);
            headA.push(xHead);
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
// マウスdown
function mouse_down(e,mt) {
    // 3本指タッチは戻る
    if (mt == "t" && e.targetTouches.length > 2) {
        sel_a.value = "";
        screen_disp(1);
    }  
    mouseDownDate = new Date();
}
// マウスup
function mouse_up(x,y) {
    // マウス up - down 長押
    mouseUpX = Math.round(x);
    mouseUpY = Math.round(y);
    mouseUpDate = new Date();
    if (mouseUpDate.getTime() - mouseDownDate.getTime() < con_long) return;
    // 地図表示、現在地取得
    if (can_mode == 1 || can_mode == 5 || can_mode == 6) navigator.geolocation.getCurrentPosition(gen_ok_b,gen_err,gen_opt);
}
// 記録表示
function screen_rec() {
    if (con_file == "" || !cGen.adjF) {
        in_data_n.style.display = "none";
        in_data_y.style.display = "none";
    } else if (con_timerF) {
        in_data_n.style.display = "none";
        in_data_y.style.display = "inline";
    } else {
        in_data_n.style.display = "inline";
        in_data_y.style.display = "none";
    }
}
// 表示
function screen_disp(screen) {
    // 機能選択                   c m o 2 e d k v a h f l s c i
    if (screen == 1)  {screen_sub(0,0,0,0,0,0,0,0,0,0,0,0,0,0,1)}
    // 地図選択    
    if (screen == 8)  {screen_sub(1,2,0,0,0,0,0,0,0,0,0,0,0,0,0)}
    // データ操作   
    if (screen == 11) {screen_sub(0,0,2,0,0,0,0,0,0,0,0,0,0,0,1)}   
    // 選択表示
    if (screen == 12) {screen_sub(0,0,2,2,0,0,0,0,0,0,0,0,0,0,1)}
    // 全データ表示
    if (screen == 22) {screen_sub(0,0,2,0,0,0,1,1,1,0,0,0,0,0,1)}
    // 選択表示
    if (screen == 23) {screen_sub(0,0,2,2,0,0,1,1,0,1,1,1,0,0,1)}
    // 集計表示
    if (screen == 24) {screen_sub(0,0,2,0,0,0,0,0,0,0,0,0,1,0,1)}
    // 管理追加・全保存   
    if (screen == 81) {screen_sub(0,0,2,0,2,0,0,0,1,0,0,0,0,0,1)}
    // 選択保存   
    if (screen == 82) {screen_sub(0,0,2,2,2,0,0,0,0,1,1,1,0,0,1)}
    // 選択削除
    if (screen == 83) {screen_sub(0,0,2,2,0,2,0,0,0,1,1,1,0,0,1)}
}
// 表示sub
function screen_sub(can,map,ope,ope2,exe,del,key,val,all,head,flag,log,summ,ctrl,info) {
    let x = {0:"none",1:"block",2:"inline",7:"hidden",8:"visible"}
    div_can.style.display      = x[can];
    in_map_text.style.display  = x[map];
    sel_map_ex.style.display   = x[map];
    sel_data.style.display     = x[ope];
    sel_c.style.display        = x[ope2];
    in_data_exe.style.display  = x[exe];
    in_data_flag.style.display = x[del];
    in_data_log.style.display  = x[del];
    div_act1.style.display     = x[key];
    div_act2.style.display     = x[val];
    div_all.style.display      = x[all];
    div_head.style.display     = x[head];
    div_flag.style.display     = x[flag];
    div_log.style.display      = x[log];
    div_summ.style.display     = x[summ];
    div_ctrl.style.display     = x[ctrl];
    div_info.style.display     = x[info];
    // 補正
    screen_rec();
}
// sel_c 表示
function sel_c_disp() {
    // 登録データ取得 head
    key_all = [];    
    for (let i = 0; i < localStorage.length; i++) {
        let temp = localStorage.key(i);
        if (temp.substr(0,8) == MAP_HEAD) key_all.push(temp);
    }
    key_all.sort();
    // option削除
    let sel = sel_c.options;
    for (let i = sel.length - 1; i > -1; i--) {
        if (!sel[i].selectid) sel_c.removeChild(sel[i]);
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
        sel_c.appendChild(opt);
    }
    sel_c.value = "";
}
// Web Storage 読込
function storage_get() {
    let strFlag = MAP_FLAG + cHead.id;
    let strLog = MAP_LOG + cHead.id;
    // flag,log 配列作成
    flagT = [];
    logT  = [];
    for (let i = 0; i < localStorage.length; i++) {
        let x = localStorage.key(i);
        if (x.substr(0,10) == strFlag) flagT.push(x);
        if (x.substr(0,10) == strLog) logT.push(x);
    }
    // flag 配列作成
    flagT.sort();
    flagA = [];
    for (item of flagT) {
        cFlag = new classFlag;
        cFlag.set(localStorage.getItem(item));
        flagA.push(cFlag);
    }
    // log 配列作成
    logT.sort();
    logA = [];    
    let aX = 0; //調整 x
    let aY = 0; //調整 y   
    for (item of logT) {
        cLog = new classLog;
        cLog.set(item,localStorage.getItem(item),aX,aY);
        aX = cLog.x;
        aY = cLog.y;
        logA.push(cLog);
    }
}
// Web Storage 出力
function storage_log(map,id,dt,opt,long,lat,str) {
    let mm = ("00" + (dt.getMonth()+1)).slice(-2);
    let dd = ("00" +  dt.getDate()).slice(-2);
    let HH = ("00" + (dt.getHours())).slice(-2);
    let MM = ("00" + (dt.getMinutes())).slice(-2);
    // log追加
    let key = `${map}${id}_${mm}${dd}_${HH}${MM}${opt}`;
    let val = `${long} ${lat} ${str}`;
    localStorage.setItem(key,val);
    if (sel_a.value == "aDisp") {
        cLog.display(CON_LOG,"l",`${mm}${dd}`,`${HH}${MM}`,long,cGen.adjX,lat,cGen.adjY,"r");
    } else {
        cLog.display(CON_LOG,"r",`${mm}${dd}`,`${HH}${MM}`,long,cGen.adjX,lat,cGen.adjY,"r");
    } 
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
    let xHead = new classHead;
    for (xHead of headA) tbody_append(tbo_summ,xHead.key,`${xHead.logCount} , ${xHead.flagCount}`);
}
// tbo_head, tbo_log 表示
function tbo_head_flag_log_disp() {
    // head,flag,log 取得
    headT = [];
    flagT = [];
    logT = [];
    let strHead = MAP_HEAD + sel_c.value.substr(8,2);    
    let strFlag = MAP_FLAG + sel_c.value.substr(8,2);
    let strLog = MAP_LOG + sel_c.value.substr(8,2);
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
// tbody 行追加
function tbody_append(ctrl,key,value) {
    let row = ctrl.insertRow();
    let cell = row.insertCell();
    let k = document.createTextNode(key);
    let v = document.createTextNode(value);
    cell.appendChild(k);
    cell = row.insertCell();
    cell.appendChild(v);
}
// tbody 行削除
function tbody_detete(ctrl) {
    for (let i = ctrl.rows.length - 1; i > -1; i--) ctrl.deleteRow(i);    
};
// 開始
let cConv     = new classConvert;
let cFlag     = new classFlag;
let cGen      = new classGenzai;
let cLog      = new classLog;
let cHead     = new classHead;
let cText     = new classText;
let cImage    = new Image;
let can_rect  = can_main.getBoundingClientRect();
let can_mode  = 0;      // 1:現在地設定、2:Flag設定、3:位置計測、5:地図表示、6:経路表示
let con_file  = "";     // 地図file名
let con_long  = 2;      // 長押し(2秒)
let con_posF  = false;  // 現在地設定
let con_timerId;        // タイマーid
let con_timerF = false; // タイマー起動状態
let con_timerG = 600;   // 現在地取得間隔(600秒)
let flagA;              // flag Array
let flagApos;           // flag Array 選択位置
let flagT;              // flag Array
let headA;              // head Array
let headT;              // head Array
let info_cnt  = 0;
let info_save = "";
let key_all;
let key_save;
let logA;               // log Array
let logT;               // log Array
let draw_f = true;      // draw flag
let draw_md;            // draw 月日
let draw_minute;        // draw 分
let mouseDownDate;      // mouse down日付時間
let mouseUpDate;        // mouse up日付時間
let mouseUpX;           // mouse up x
let mouseUpY;           // mouse up y
let val_all;
let val_save;
