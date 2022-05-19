export interface IRect{
    x:number,
    y:number,
    width:number,
    height:number;
}

export function isMouseEvent(event:Event): event is MouseEvent {
  return event instanceof MouseEvent;
}

export function isTouchEvent(event:Event):event is TouchEvent {
  return event instanceof TouchEvent;
}

export function rect(width: number, height: number): IRect {
  return {
    x: 0,
    y: 0,
    width,
    height,
  };
}


export function getPageEvent(ev:MouseEvent | TouchEvent) {
  if (isMouseEvent(ev)) {
    return ev;
  }
  return ev.touches[0];
}

export function hasOwnProperty(obj: Record<string, any>, prop: string) {
  // https:// developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
  return Object.prototype.hasOwnProperty.call(obj, prop);
}


export function setStyle(el: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  for (const key in styles) {
    if (hasOwnProperty(styles, key) && styles[key] !== undefined) {
      el.style[key] = styles[key]!;
    }
  }
}


export function limitRotateAngle(angle: number) {
  if (angle < -90) {
    return -90;
  }

  if (angle > 90) {
    return 90;
  }

  return angle;
}


