function enableTabsDragScroll() {
    const selectors = ['.org-tabs-list', '.farm-tabs-list', '.zone-tabs-list'];
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(list => {
            // Снимаем старые обработчики (если есть)
            list.onmousedown = null;
            list.onmouseleave = null;
            list.onmouseup = null;
            list.onmousemove = null;

            let isDown = false;
            let startX;
            let scrollLeft;

            list.addEventListener('mousedown', (e) => {
                isDown = true;
                list.classList.add('dragging');
                startX = e.pageX - list.offsetLeft;
                scrollLeft = list.scrollLeft;
            });
            list.addEventListener('mouseleave', () => {
                isDown = false;
                list.classList.remove('dragging');
            });
            list.addEventListener('mouseup', () => {
                isDown = false;
                list.classList.remove('dragging');
            });
            list.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - list.offsetLeft;
                const walk = (x - startX) * 1.5;
                list.scrollLeft = scrollLeft - walk;
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', enableTabsDragScroll);
window.enableTabsDragScroll = enableTabsDragScroll; 