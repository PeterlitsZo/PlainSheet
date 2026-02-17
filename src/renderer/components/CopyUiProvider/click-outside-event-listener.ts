class ClickOutsideEventListener {
  stack: { el: HTMLElement; callback: (event: MouseEvent) => void }[] = [];
  handleClickOutside: (event: MouseEvent) => void;

  constructor() {
    this.handleClickOutside = this.handleClickOutsideInner.bind(this);
  }

  register(el: HTMLElement, callback: (event: MouseEvent) => void) {
    this.stack.push({ el, callback });
    if (this.stack.length === 1) {
      document.addEventListener("mousedown", this.handleClickOutside);
    }
  }

  unregister(el: HTMLElement, callback: (event: MouseEvent) => void) {
    this.stack = this.stack.filter(
      (item) => item.el !== el && item.callback !== callback,
    );
    if (this.stack.length === 0) {
      document.removeEventListener("mousedown", this.handleClickOutside);
    }
  }

  handleClickOutsideInner(event: MouseEvent) {
    const topEl = this.stack[this.stack.length - 1].el;
    if (topEl.contains(event.target as Node)) {
      return;
    }
    this.stack[this.stack.length - 1].callback(event);
  }
}

export { ClickOutsideEventListener };
