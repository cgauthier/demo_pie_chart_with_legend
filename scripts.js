/*
    The purpose of this code sample is 
    to demonstrate how to create a pie chart
    and provide a legend inside of it

    The code below is not optimized as production quality
    It is only meant to demonstrate how to code the solution.

    Of the following goals being accomplished:
    
    1) create a data-driven pie chart using HTML Canvas
    2) use HEX color to generate a tooltip for the Canvas (as a title attribute)
    3) Provide a 1% buffer for slices where the percentage is less than 1%
    4) add the legend of the pie chart in the middle (it mimicks a donut chart)
    5) CSS is used for calculations
    6) pull CSS var values to generate to set the canvas width and height and to set colors for data array
    7) fake a tooltip scheme based on canvas title attribute and the ability to pull color from mouse position
    
*/
window.onload = init;

let data = [{
    "id": "connected",
    "display": "Connected",
    "value": 20
}, {
    "id": "scheduleddown",
    "display": "Scheduled Down",
    "value": 1
}, {
    "id": "unscheduleddown",
    "display": "Unscheduled Down",
    "value": 305
}, {
    "id": "notinsync",
    "display": "Not In Sync",
    "value": 245
}];

let tooltipData = {};

function setDataColors (styleObj) {
    data.forEach(function(item) {
        let id = item.id;
        let styleRef = `--${id}_color`;
        let value = this.getPropertyValue(styleRef);
        item.color = value;
    }.bind(styleObj));
    return data;

}

function findIndexOfLargestValue(data) {
    let idx = 0;
    let largeVal = data[idx].percentValue;
    for(let x = 1; x < data.length; x++) {
        if(data[x].percentValue > largeVal) {
            largeVal = data[x].percentValue;
            idx = x;
        }
    }
    return idx;
}

function getElPosition(obj) {
    let curLeft = 0, curTop = 0;
    if(obj.offsetParent) {
        do {
            curLeft += obj.offsetLeft;
            curTop += obj.offsetTop;
        } while(obj = obj.offsetParent);
        return {
            x: curLeft,
            y: curTop
        };
    }
    return undefined;
}

function getMouseLocationByEvent (el, e) {
    let pos = getElPosition(el);
    return {
        x: (e.pageX - pos.x),
        y: (e.pageY - pos.y)
    };
}

function rgbToHex(r, g, b) {
    if(r > 255 || g > 255 || b > 255) {
        throw "Invalid color scheme.";
    } 
    let val = ((r << 16) | (g << 8) | b).toString(16);
    return val;
}

function init() {

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    const styleObj = window.getComputedStyle(document.body);
    let rawSize = styleObj.getPropertyValue('--size');
    let size = parseInt(rawSize);
    canvas.width = size;
    canvas.height = size;
    data = setDataColors(styleObj);
    
    data.forEach(item => {
        let v = Math.round((item.value) * 100);
        item.roundValue = v;            
    });

    let total = data.reduce((acc, curValue) => acc + curValue.roundValue, 0);

    data.forEach(item => {
        let v = Math.round((item.roundValue / total) * 100);
        v = v / 100;
        if(v < .01) {
            v = .01;
        }
        item.percentValue = v;            
    });        

    let percentTotal = (data.reduce((acc, curValue) => acc + curValue.percentValue, 0));

    if(percentTotal != 1) {
        let idx = findIndexOfLargestValue(data);
        let percentVal = data[idx].percentValue;
        let offset, reminder;

        if(percentTotal > 1) {
            reminder = Math.round((percentTotal - 1) * 100) / 100;
            offset = percentVal - reminder;
        }

        if(percentTotal < 1) {
            reminder = Math.round((1 - percentTotal) * 100) / 100;
            offset = percentVal + reminder;
        }        

        data[idx].percentValue = offset;
    }
    
    let pieStartAngle = 0;
    let offset = 20;
    let radius = (size - offset) / 2;
    let cx = size / 2;
    let cy = size / 2;
    const TAU = Math.PI * 2;

    data.forEach(item => {
        if(item.value) {
            ctx.fillStyle = item.color;
            ctx.lineWidth = 1;
            ctx.strokeStyle = item.color;
            ctx.beginPath();
            let pieEndAngle = (item.percentValue * TAU) + pieStartAngle;
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, pieStartAngle, pieEndAngle, false);
            ctx.lineTo(cx, cy);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            pieStartAngle = pieEndAngle;
            tooltipData[item.color] = `${item.display}: ${item.value}`;
        }
        let domId = `value_${item.id}`;
        let domEl = document.getElementById(domId);
        domEl.innerHTML = item.value;
    });

    canvas.addEventListener("mousemove", function(e) {
        canvas.removeAttribute("title");
        let eLoc = getMouseLocationByEvent(canvas, e);
        let pD = ctx.getImageData(eLoc.x, eLoc.y, 1, 1).data;
        let hex;
        if(!((pD[0] == 0) && (pD[1] == 0) && (pD[2] == 0) && (pD[3] == 0))) {
            let hexCore = rgbToHex(pD[0], pD[1], pD[2]);
            if(hexCore) {
                hex = `#${("000000" + hexCore).slice(-6)}`;
            }
        }
        if(hex) {
            let tp = tooltipData[hex];
            if(tp) {
                canvas.setAttribute("title", tp);    
            }
        }
    });
}