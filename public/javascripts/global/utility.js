function setVisible(element, visible = true) {
    element = byId(element)
    
    if (visible) {
        element.classList.remove("invisible")
    } else {
        element.classList.add("invisible")
    }
}

function getParam(param) {
    return new URLSearchParams(location.search).get(param)
}

function byId(id) {
    return (typeof id === "string") ? document.getElementById(id) : id
}

function createElement(type, options) {
    const element = document.createElement(type)
    const { c, onClick, consumer, p, r, t } = options ?? {}

    if (typeof c === "string") {
        const parts = c.split(" ")

        for (let clazz of parts) {
            element.classList.add(clazz)
        }
    }
    if (onClick) element.addEventListener("click", e => onClick(e, element))
    if (p) byId(p).appendChild(element)
    if (r) byId(r).replaceWith(element)
    if (t) element.innerHTML = t
    if (consumer) consumer(element)

    return element
}