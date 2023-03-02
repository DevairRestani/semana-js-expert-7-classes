export default class HandGestureView {
  #handsCanvas = document.querySelector("#hands");
  #canvasContext = this.#handsCanvas.getContext("2d");
  #fingerLookupIndexes;

  constructor({ fingerLookupIndexes }) {
    this.#handsCanvas.width = globalThis.screen.availWidth;
    this.#handsCanvas.height = globalThis.screen.availHeight;
    this.#fingerLookupIndexes = fingerLookupIndexes;
  }

  clear() {
    this.#canvasContext.clearRect(
      0,
      0,
      this.#handsCanvas.width,
      this.#handsCanvas.height
    );
  }

  clickOnElement(x, y) {
    const element = document.elementFromPoint(x, y);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const event = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + x,
      clientY: rect.top + y,
    });

    element.dispatchEvent(event);
  }

  drawHands(hands) {
    for (const { handedness, keypoints } of hands) {
      if (!keypoints) continue;

      this.#canvasContext.fillStyle = handedness === "Left" ? "red" : "blue";
      this.#canvasContext.strokeStyle = "white";
      this.#canvasContext.lineWidth = 8;
      this.#canvasContext.lineJoin = "round";

      this.#drawJoints(keypoints);
      this.#drawFingersAndHoverElement(keypoints);
    }
  }

  drawImage(image, x, y, width, height) {
    this.#canvasContext.drawImage(image, x, y, width, height);
  }

  #drawJoints(keypoints) {
    for (const { x, y } of keypoints) {
      this.#canvasContext.beginPath();
      const newX = x - 2;
      const newY = y - 2;
      const radius = 5;
      const startAngle = 0;
      const endAngle = Math.PI * 2;
      this.#canvasContext.arc(newX, newY, radius, startAngle, endAngle);
      this.#canvasContext.fill();
    }
  }

  #drawFingersAndHoverElement(keypoints) {
    const fingers = Object.keys(this.#fingerLookupIndexes);
    for (const finger of fingers) {
      const points = this.#fingerLookupIndexes[finger].map(
        (index) => keypoints[index]
      );

      const region = new Path2D();
      // [0] is the wrist
      const [{ x, y }] = points;
      for (const point of points) {
        region.lineTo(point.x, point.y);
      }
      this.#canvasContext.stroke(region);
    }
  }

  holdOnElement(x, y, keypoints3D) {
    const element = document.elementFromPoint(x, y);
    console.log(element);
    if (!element) return;

    const IndexFinger = keypoints3D[8];

    element.style.border = "1px solid red";

    // apply css to element
    element.style.transform = `rotateX(${IndexFinger[1]}deg) rotateY(${IndexFinger[0]}deg) rotateZ(${IndexFinger[2]}deg)`;
    element.style.transformOrigin = "center";
    element.style.transition = "transform 0.1s ease-in-out";
  }

  loop(fn) {
    requestAnimationFrame(fn);
  }

  scrollPage(top) {
    scroll({
      top,
      behavior: "smooth",
    });
  }
}
