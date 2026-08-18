// ==UserScript==
// @name         豆包图片粘贴助手
// @namespace    http://tampermonkey.net/
// @version      2026-08-18
// @description  Ctrl+V 直接粘贴剪贴板图片上传到豆包
// @author       Watermelon
// @match        https://www.doubao.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function enableDoubaoPasteImage() {
    // 查找图片上传 input
    function getUploadInput() {
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const input of inputs) {
            if (input.accept && input.accept.includes('image')) {
                return input;
            }
        }
        return inputs[0] || null;
    }

    // 尝试上传，支持重试
    async function tryUploadImage(imageFile, retryTimes = 5, delayMs = 200) {
        let fileInput = getUploadInput();
        for (let i = 0; i < retryTimes && !fileInput; i++) {
            await new Promise(r => setTimeout(r, delayMs));
            fileInput = getUploadInput();
        }
        if (!fileInput) {
            console.error('❌ 未找到豆包图片上传控件');
            return false;
        }

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(imageFile);
        fileInput.files = dataTransfer.files;

        // React环境 change + input 双事件触发！解决无响应问题
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));

        console.log('✅ 图片已触发上传');
        return true;
    }

    // 使用冒泡阶段监听，不再抢占捕获
    document.addEventListener('paste', async function (e) {
        try {
            const items = e.clipboardData?.items;
            if (!items) return;

            let imageFile = null;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    imageFile = item.getAsFile();
                    break;
                }
            }
            if (!imageFile) return;

            // 只拦截图片粘贴，不强行阻断所有事件
            e.preventDefault();
            await tryUploadImage(imageFile);
        } catch (err) {
            console.error('粘贴图片脚本异常', err);
        }
    }, false);

    console.log('✅ 豆包图片粘贴脚本已启用，Ctrl+V 即可粘贴上传');
})();
