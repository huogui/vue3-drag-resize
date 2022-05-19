<script setup lang="ts">
import { computed, CSSProperties, ref } from 'vue';
import { rect, getPageEvent, isMouseEvent, IRect, setStyle, limitRotateAngle } from '../utils';

export type TStick = 'tl' | 'tm' | 'tr' | 'mr' | 'br' | 'bm' | 'bl' | 'ml';

export interface IDragResizeProps {
  x?: number;
  y?: number;
  z?: number;
  width?: number;
  height?: number;
  rotate?: number;

  /** 立即更新：由外部属性改变来更新视图，性能差一些 */
  immediate?: boolean;

  /** 容器缩放X */
  parentScaleX?: number;

  /** 容器缩放Y */
  parentScaleY?: number;

  /** 操作杆大小 */
  stickSize?: number;

  /** 操作杆方向 */
  sticks?: Array<TStick>;

  /** 可缩放 */
  resizable?: boolean;

  /** 可旋转 */
  rotatable?: boolean;

  /** 激活状态 */
  active?: boolean;
}
const props = withDefaults(defineProps<IDragResizeProps>(), {
  x: 0,
  y: 0,
  z: 0,
  width: 100,
  height: 100,
  rotate: 0,
  sticks: () => [ 'tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml' ],
  stickSize: 10,
  parentScaleX: 1,
  parentScaleY: 1,
  rotatable: true,
  resizable: true,
  active: false,
  immediate: false,
});

interface IDragResizeEmits {
  (e: 'dragging', ev: IRect): void;
  (e: 'dragEnd', ev: IRect): void;
  (e: 'resizing', ev: IRect): void;
  (e: 'resizeEnd', ev: IRect): void;
  (e: 'rotating', ev: number): void;
  (e: 'rotateEnd', ev: number): void;
}
const emits = defineEmits<IDragResizeEmits>();

// 记录更新的位置
const rectBox = rect(props.width, props.height);


// 上次更新的位置
const lastPoint = {
  x: 0,
  y: 0,
};

const vdrRef = ref<HTMLElement>();


const bodyStyle = computed<CSSProperties>(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `rotate(${props.rotate}deg)`,
}));


const vdrStyle = computed<CSSProperties>(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
  zIndex: props.z,
}));

function dragging(ev: MouseEvent | TouchEvent) {
  if (!vdrRef.value) {
    return;
  }

  const { pageX, pageY } = getPageEvent(ev);
  const deltaX = pageX - lastPoint.x;
  const deltaY = pageY - lastPoint.y;

  if (props.immediate) {
    lastPoint.x = pageX;
    lastPoint.y = pageY;
    rectBox.x = deltaX + rectBox.x;
    rectBox.y = deltaY + rectBox.y;
    emits('dragging', rectBox);
    return;
  }

  rectBox.x = deltaX + props.x;
  rectBox.y = deltaY + props.y;

  setStyle(vdrRef.value, {
    left: `${rectBox.x}px`,
    top: `${rectBox.y}px`,
  });
}

function dragend() {
  emits('dragEnd', rectBox);
  lastPoint.x = 0;
  lastPoint.y = 0;
  document.removeEventListener('mousemove', dragging);
  document.removeEventListener('mouseup', dragend);
  document.removeEventListener('touchmove', dragging);
  document.removeEventListener('touchend', dragend);
}


function dragstart(ev: MouseEvent | TouchEvent) {
  if (!props.active) {
    return;
  }

  rectBox.x = props.x;
  rectBox.y = props.y;

  const { pageX, pageY } = getPageEvent(ev);
  lastPoint.x = pageX;
  lastPoint.y = pageY;

  if (isMouseEvent(ev)) {
    document.addEventListener('mousemove', dragging);
    document.addEventListener('mouseup', dragend);
    return;
  }

  document.addEventListener('touchmove', dragging);
  document.addEventListener('touchend', dragend);
}


// 旋转
let rotateAngle = 0;
const rotatePointerRef = ref<HTMLElement>();
const bodyRef = ref<HTMLElement>();

const rotatePointerStyle = computed<CSSProperties>(() => ({
  transform: `rotate(${props.rotate}deg)`,
}));


function rotating(ev: MouseEvent | TouchEvent) {
  if (!bodyRef.value || !rotatePointerRef.value) {
    return;
  }

  const { pageX, pageY } = getPageEvent(ev);
  const deltaX = Math.min(Math.max(pageX - lastPoint.x, -50), 50);
  // const deltaY = Math.min(pageY - lastPoint.y, 50);
  const deltaAngle = Math.asin(deltaX / 50) * 180 / Math.PI;

  if (props.immediate) {
    lastPoint.x = pageX;
    lastPoint.y = pageY;
    rotateAngle = limitRotateAngle(rotateAngle + deltaAngle);
    emits('rotating', rotateAngle);
    return;
  }

  rotateAngle = limitRotateAngle(props.rotate + deltaAngle);
  setStyle(bodyRef.value, {
    transform: `rotate(${rotateAngle}deg)`,
  });
  setStyle(rotatePointerRef.value, {
    transform: `rotate(${rotateAngle}deg)`,
  });
}

function rotateEnd() {
  emits('rotateEnd', rotateAngle);
  lastPoint.x = 0;
  lastPoint.y = 0;
  document.removeEventListener('mousemove', rotating);
  document.removeEventListener('mouseup', rotateEnd);
  document.removeEventListener('touchmove', rotating);
  document.removeEventListener('touchend', rotateEnd);
}


function rotateStart(ev: MouseEvent | TouchEvent) {
  rotateAngle = props.rotate;

  const { pageX, pageY } = getPageEvent(ev);
  lastPoint.x = pageX;
  lastPoint.y = pageY;

  if (isMouseEvent(ev)) {
    document.addEventListener('mousemove', rotating);
    document.addEventListener('mouseup', rotateEnd);
    return;
  }

  document.addEventListener('touchmove', rotating);
  document.addEventListener('touchend', rotateEnd);
}


</script>
<template>
  <div
    ref="vdrRef"
    class="dragger"
    :style="vdrStyle"
  >
    <div
      @mousedown="dragstart"
      @touchstart="dragstart"
    >
      <div
        ref="bodyRef"
        :style="bodyStyle"
      >
        <slot />
      </div>
      <!-- 被选中状态 -->
      <div :class="['dragger-drag', { active: props.active }]" />
      <!-- 旋转轴 -->
      <div :class="['dragger-rotate', (props.active && props.rotatable) ? '' : 'not-ratable']">
        <div
          ref="rotatePointerRef"
          class="dragger-rotate-pointer"
          :style="rotatePointerStyle"
          @mousedown.stop.prevent="rotateStart($event)"
          @touchstart.stop.prevent="rotateStart($event)"
        />
      </div>
    </div>
  </div>
</template>


<style lang="less">
  @import "./vue-drag-resize.less";
</style>
