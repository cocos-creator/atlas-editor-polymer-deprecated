Atlas面板
=========

Atlas面板用于设置和图集有关的属性。

- Auto Size: 自动缩放，添加或删除sprite时自动设置图集大小。
- Width: 图集宽度。
- Height: 图集高度。
- Trim: 裁剪，移除sprite四周的透明像素，这样能节省图集大小。
- Trim Threshold: 裁剪阈值，取值范围从1到255，默认是1。当执行trim操作的时候，透明度低于该阈值的像素将被视作透明。
- Algorithm: 排布算法，决定了sprite如何在图集内排布。默认是最节省空间的MaxRect算法。
- Sort By: 排列依据，只有当algorithm设为Basic或Tree时才起作用。
- Sort Order: 排列方向，只有当algorithm设为Basic或Tree时才起作用。
- Allow Rotate: 允许旋转，允许顺时针或逆时针旋转90度，这样能节省图集大小。
- Contour Bleed: 拓展透明色，在sprite内部的透明像素上填充相邻色。  
  这个操作用于减少sprite渲染时由于重采样导致的黑色杂边，不会修改sprite的alpha通道，也不会改变其外观和大小。
- Padding Bleed: 拓展外框，将sprite边框内的一圈像素覆盖到边框外。  
  这个操作能防止渲染时sprite的边缘采样到外侧的其它像素而导致模糊，同时消除多个sprite拼接时的接缝。这个操作只应用于sprite的外部，不会改变其外观和大小。
- Custom Padding: 自定义间距，指定sprite在图集内排布时的最小间距，默认是2。当启用Padding Bleed时，这个值最小是2。
- Build Color: 导出背景色，用于填充或取消导出图集的背景色，背景色可以设成半透明。启用该项后Contour Bleed将失效。