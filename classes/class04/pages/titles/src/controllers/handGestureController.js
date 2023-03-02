import { prepareRunChecker } from "../../../../lib/shared/util.js";

const { shouldRun: scrollShouldRun } = prepareRunChecker({ timerDelay: 200 });
const { shouldRun: clickShouldRun } = prepareRunChecker({ timerDelay: 1000 });
export default class HandGestureController {
  #service;
  #view;
  #camera;
  #lastDirection = { direction: "", y: 0 };
  constructor({ view, service, camera }) {
    this.#service = service;
    this.#view = view;
    this.#camera = camera;
  }

  async init() {
    return this.#loop();
  }

  #scrollPage(direction) {
    // stop on page size
    if (this.#lastDirection.y === 0 && direction === "scroll-up") return;

    const scrollSize = 50;
    if (this.#lastDirection.direction === direction) {
      this.#lastDirection.y =
        direction === "scroll-down"
          ? this.#lastDirection.y + scrollSize
          : this.#lastDirection.y - scrollSize;
    } else {
      this.#lastDirection.direction = direction;
    }

    this.#view.scrollPage(this.#lastDirection.y);
  }

  async #estimateHands() {
    try {
      const hands = await this.#service.estimateHands(this.#camera.video);
      this.#view.clear();

      if (hands?.length) {
        this.#view.drawHands(hands);
      }
      for await (const { event, x, y, hand } of this.#service.detectGestures(
        hands
      )) {
        console.log(event);
        if (event === "click") {
          if (!clickShouldRun()) continue;
          this.#view.clickOnElement(x, y);
          continue;
        } else if (event.includes("scroll")) {
          if (!scrollShouldRun()) continue;
          this.#scrollPage(event);
        } else if (event === "hold") {
          const { keypoints3D } = hand;
          this.#view.holdOnElement(x, y, keypoints3D);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async #loop() {
    await this.#service.initializeDetector();
    await this.#estimateHands();
    this.#view.loop(this.#loop.bind(this));
  }

  static async initialize(deps) {
    const controller = new HandGestureController(deps);
    return controller.init();
  }
}
