export function compress(json) {
    return LZString.compressToBase64(JSON.stringify(json))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export function initCodeSandboxButton(parameters) {
    const button = document.getElementById('sandbox-button');
    const form = document.querySelector('#sandbox-form');

    if (button && form) {
        button.onclick = function(event) {
            event.preventDefault();
            form.parameters.value = compress(parameters);
            form.submit();
        }
    }
}