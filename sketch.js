let forms = [];
// let es = new p5.Ease();
let es = {
  quadraticInOut(t){
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  quadraticIn(t){
    return t * t;
  },
  backInOut(t){
    const s = 1.70158 * 1.525;
    if (t < 0.5) {
      const p = 2 * t;
      return 0.5 * (p * p * ((s + 1) * p - s));
    } else {
      const p = 2 * t - 2;
      return 0.5 * (p * p * ((s + 1) * p + s) + 2);
    }
  }
};
let colors = ["#fe4a49", "#fed766", "#009fb7", "#f0f0f0"];

// 左側滑入半透明方塊
let leftPanel;

// overlay DOM 相關
let overlayEl = null;

class LeftPanel {
  constructor(h){
    this.w = 200;            // 固定寬度 200
    this.h = h;
    this.x = -this.w;       // 初始隱藏在左側外面
    this.targetX = -this.w;
    this.speed = 0.18;      // 插值速度（數值越大越快）
    this.alpha = 160;       // 半透明

    // 連結設定：第一個為作品一，第二個為筆記
    this.links = [
      { label: "作品一", url: "https://414730431tku-eng.github.io/20251014/" },
      { label: "筆記", url: "https://hackmd.io/@xJbStK8iScy5bAygweCuHA/ByIlt_J3ll" }
    ];
    this.linkRects = []; // 每幀繪製時更新，供點擊檢測使用
    this.textSize = 22;  // 文字大小（可調）
    this.topOffset = 70; // 第一個連結距離上方 70px
    this.lineSpacing = 18; // 兩連結之間間距
  }

  open(){
    this.targetX = 0;
  }

  close(){
    this.targetX = -this.w;
  }

  // 判斷滑鼠是否在面板範圍內（以目前 x 位置計算）
  contains(mx, my){
    return mx >= this.x && mx <= this.x + this.w && my >= 0 && my <= this.h;
  }

  // 取得指定位置上的連結索引（若無則回傳 -1）
  getLinkAt(mx, my){
    for (let i = 0; i < this.linkRects.length; i++){
      const r = this.linkRects[i];
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
    }
    return -1;
  }

  // 面板被點擊時呼叫（若點到連結則開啟 overlay）
  onClickAt(mx, my){
    const idx = this.getLinkAt(mx, my);
    if (idx >= 0){
      openOverlay(this.links[idx].label, this.links[idx].url);
    }
  }

  update(){
    this.x = lerp(this.x, this.targetX, this.speed);
  }

  resize(h){
    this.h = h;
  }

  show(){
    push();
    noStroke();
    rectMode(CORNER);     // 以左上角為座標繪製
    fill(255, this.alpha); // 白色半透明，可改成其他顏色
    rect(this.x, 0, this.w, this.h);

    // 繪製可點擊文字（置中、放大、第一個距離上方70px）
    fill(20, 220); // 深色半透明文字
    noStroke();
    textAlign(CENTER, TOP);
    textSize(this.textSize);

    // 建立 linkRects
    this.linkRects = [];
    for (let i = 0; i < this.links.length; i++){
      const ty = this.topOffset + i * (this.textSize + this.lineSpacing);
      const tx = this.x + this.w * 0.5;
      // 只有當面板部分可見時才畫文字
      if (this.x + this.w > 0) {
        text(this.links[i].label, tx, ty);
      }
      // 將可點擊區域記錄為整個面板寬度內、文字高度範圍
      const rectX = this.x;
      const rectY = ty;
      const rectW = this.w;
      const rectH = this.textSize + 8; // 文字高度 + padding
      this.linkRects.push({ x: rectX, y: rectY, w: rectW, h: rectH });
    }

    pop();
  }

  run(){
    this.update();
    this.show();
  }
}

// 建立並置中格子
function createForms(){
    forms = [];
    let seg = 10;
    let gridSize = min(width, height) * 0.9; // 使用視窗短邊的 90%
    let w = gridSize / seg;
    let startX = (width - gridSize) / 2 + w/2;
    let startY = (height - gridSize) / 2 + w/2;
    for (let i = 0; i < seg; i++) {
        for (let j = 0; j < seg; j++) {
            let x = startX + i * w;
            let y = startY + j * w;
            let rnd = int(random(5)+1);
            let off = 0;
            if(rnd == 1){
                forms.push(new Form01(x, y, w - off));
            }
            else if(rnd == 2){
                forms.push(new Form02(x, y, w - off));
            }
            else if(rnd == 3){
                forms.push(new Form03(x, y, w - off));
            }
            else if(rnd == 4){
                forms.push(new Form04(x, y, w - off));
            }
            else if(rnd == 5){
                forms.push(new Form05(x, y, w - off));
            }
        }
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    strokeWeight(4);
    createForms();

    leftPanel = new LeftPanel(height); // 建立左側面板
}

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);
    createForms();
    if (leftPanel) leftPanel.resize(height);
    // 若 overlay 存在，重新調整大小
    if (overlayEl) adjustOverlaySize();
}

function draw() {
    background("#0d2c54"); // 背景填滿整個畫布
    for(let f of forms){
        f.run();
    }

    // 判斷滑鼠是否在面板範圍內（panel.x 會根據動畫變動）
    let hoveringPanel = leftPanel.contains(mouseX, mouseY);

    // 若滑鼠靠近左邊界或在面板上，開啟面板；否則收回
    if (mouseX <= 2 || hoveringPanel) {
      leftPanel.open();
    } else {
      leftPanel.close();
    }

    // 繪製面板（置於最上層）
    leftPanel.run();

    // 判斷是否在 link 上（linkRects 在 show() 中已更新）
    let hoveringLink = leftPanel.getLinkAt(mouseX, mouseY) >= 0;

    // 改變滑鼠游標提示（當在面板或連結上時顯示 pointer）
    if (hoveringLink) cursor(HAND);
    else if (hoveringPanel) cursor(HAND);
    else cursor(ARROW);
}

// 處理滑鼠點擊：若在面板的連結上則開啟連結（overlay）
function mousePressed(){
  if (leftPanel) {
    leftPanel.onClickAt(mouseX, mouseY);
  }
}

// 建立 overlay (遮罩 + iframe)
// title 參數目前未顯示在畫面上，但保留以備擴充
function openOverlay(title, url){
  // 若已存在則不再建立
  if (overlayEl) return;

  // 建立遮罩層
  overlayEl = document.createElement("div");
  overlayEl.style.position = "fixed";
  overlayEl.style.left = "0";
  overlayEl.style.top = "0";
  overlayEl.style.width = "100%";
  overlayEl.style.height = "100%";
  overlayEl.style.background = "rgba(0,0,0,0.6)";
  overlayEl.style.display = "flex";
  overlayEl.style.alignItems = "center";
  overlayEl.style.justifyContent = "center";
  overlayEl.style.zIndex = "9999";

  // 按下遮罩空白處關閉 overlay
  overlayEl.addEventListener("click", function(e){
    if (e.target === overlayEl) closeOverlay();
  });

  // 建立容器（避免點擊傳遞到遮罩）
  const container = document.createElement("div");
  container.style.position = "relative";
  container.style.width = Math.floor(window.innerWidth * 0.8) + "px";
  container.style.height = Math.floor(window.innerHeight * 0.8) + "px";
  container.style.boxShadow = "0 8px 30px rgba(0,0,0,0.5)";
  container.style.background = "#fff";
  container.style.borderRadius = "4px";
  container.style.overflow = "hidden";
  container.addEventListener("click", function(e){ e.stopPropagation(); });

  // 建立 iframe
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  iframe.style.display = "block";
  container.appendChild(iframe);

  // 建立關閉按鈕
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.title = "關閉";
  closeBtn.style.position = "absolute";
  closeBtn.style.right = "8px";
  closeBtn.style.top = "8px";
  closeBtn.style.zIndex = "2";
  closeBtn.style.background = "rgba(0,0,0,0.6)";
  closeBtn.style.color = "#fff";
  closeBtn.style.border = "none";
  closeBtn.style.width = "32px";
  closeBtn.style.height = "32px";
  closeBtn.style.borderRadius = "4px";
  closeBtn.style.cursor = "pointer";
  closeBtn.addEventListener("click", function(e){
    e.stopPropagation();
    closeOverlay();
  });
  container.appendChild(closeBtn);

  overlayEl.appendChild(container);
  document.body.appendChild(overlayEl);
}

// 關閉 overlay
function closeOverlay(){
  if (!overlayEl) return;
  document.body.removeChild(overlayEl);
  overlayEl = null;
}

// 調整 overlay 大小（resize 時呼叫）
function adjustOverlaySize(){
  if (!overlayEl) return;
  const container = overlayEl.firstChild;
  if (!container) return;
  container.style.width = Math.floor(window.innerWidth * 0.8) + "px";
  container.style.height = Math.floor(window.innerHeight * 0.8) + "px";
}

//●
class Form01{
    constructor(x, y, w){
        this.x = x;
        this.y = y;
        this.w = w;
        this.ang = int(random(4)) * TAU/4;
        this.off = 0;
        this.t = -int(random(1500));
        this.t1 = 30;
        this.d = this.w * random(0.1, 0.5);
        this.col = random(colors);
    }

    show(){
        push();
        translate(this.x, this.y);
        rotate(this.ang);
        noFill();
        stroke(this.col);
        circle(this.off, 0, this.d);
        pop();
    }

    move(){
        if(0 < this.t && this.t < this.t1){
            let t = map(this.t, 0, this.t1-1, 0, TAU*6);
            this.off = sin(t)*this.w*0.01;
        }
        this.t ++;
    }

    run(){
        this.show();
        this.move();
        if(this.t1 < this.t){
            this.t = -int(random(1500));
        }
    }
}

//~
class Form02 extends Form01{
    constructor(x, y, w){
        super(x, y, w);
        this.a0 = random(10);
        this.a = this.a0;
        this.t1 = 60;
        this.amp = this.w * random(0.1, 0.4);
        this.mo = random(0.05, 0.1);
    }

    show(){
        push();
        translate(this.x, this.y);
        rotate(this.ang);
        noFill();
        stroke(this.col);
        beginShape();
        for(let y=-this.w/2; y<this.w/2; y++){
            vertex(sin((y*this.mo)+this.a) * this.amp, y);
        }
        endShape();
        pop();
    }

    move(){
        if(0 < this.t && this.t < this.t1){
            let nrm = norm(this.t, 0, this.t1 - 1);
            this.a = lerp(0, TAU, es.quadraticInOut(nrm))+this.a0;
        }
        this.t ++;
    }
}

//□
class Form03 extends Form01{
    constructor(x, y, w){
        super(x, y, w);
        this.t1 = 40;
        this.aa = 0;
        this.pn = random()<0.5 ? -1 : 1;
        this.ww = this.w* random(0.1, 0.8)
    }

    show(){
        push();
        translate(this.x, this.y);
        rotate(this.ang+this.aa);
        noFill();
        stroke(this.col);
        square(0, 0, this.ww, this.ww*0.05);
        pop();
    }

    move(){
        if(0 < this.t && this.t < this.t1){
            let nrm = norm(this.t, 0, this.t1 - 1);
            this.aa = lerp(0, PI*0.5, es.backInOut(nrm))*this.pn;
        }
        
        if(this.t1 < this.t){
            this.pn = random() < 0.5 ? -1 : 1;
        }
        this.t ++;
    }
}

//×
class Form04 extends Form01{
    constructor(x, y, w){
        super(x, y, w);
        this.ll0 = this.w*random(0.1, 0.45);
        this.ll = this.ll0;
    }

    show(){
        push();
        translate(this.x, this.y);
        rotate(this.ang);
        noFill();
        stroke(this.col);
        line(this.ll/2, this.ll/2, -this.ll/2, -this.ll/2);
        line(-this.ll0/2, this.ll0/2, this.ll0/2, -this.ll0/2);
        pop();
    }

    move(){
        if(0 < this.t && this.t < this.t1){
            let nrm = norm(this.t, 0, this.t1 - 1);
            this.ll = lerp(this.ll0, 0, es.quadraticIn(sin((1-nrm)*PI)));
        }

        this.t ++;
    }
}

//…
class Form05 extends Form01{
    constructor(x, y, w){
        super(x, y, w);
        this.num = int(random(5, 10));
        this.d *= 2;
        this.d0 = this.d;
        this.aa = 0;
        this.t1 = 50;

    }

    show(){
        push();
        translate(this.x, this.y);
        rotate(this.ang+this.aa);
        stroke(this.col);
        for(let i=0; i<this.num; i++){
            let a = map(i, 0, this.num, 0, TAU);
            point(this.d * 0.5 * cos(a), this.d * 0.5 * sin(a));
        }
        pop();
    }

    move(){
        if(0 < this.t && this.t < this.t1){
            let nrm = norm(this.t, 0, this.t1 - 1);
            this.d = lerp(this.d0, 0, es.quadraticIn(sin((1-nrm)*PI)));
            this.aa = lerp(0, TAU, nrm);
        }

        this.t ++;
    }
}