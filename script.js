$(document).ready(function() {
    // Shortcut selectors
    var $f = $('#dirSelectorForm');
    var selectorImage = $('#selectorImage')[0];
    // Constants
    var defaultSquareRadius = 20;
    var radiusResizeIncrement = 10;
    // Change this to a non-hidden file for easier access
    var labelsFileName = '.labels';
    var tagsHaveLoaded = false;
    var buffer = 5; // Images before and after the one currently viewed to store in memory

    var model = {
        /*
        webkitRelativePaths are strings

        DATA FORMAT:
        {
            imageCount: n,
            currentImage: 0 or webkitRelativePath,
            "n": {
                name: webkitRelativePath,
                rects: [
                    {
                        "top": 
                    }
                ]
            }
        }
        */
        data: {
            imageCount: 0,
            currentImage: 0
        },
        tags: [],
        pathToFileMap: {},
        loadedSoFar: 0,
        init: function() {
            console.log(model.loadedSoFar);
        },
        get: function() {
            return this.data;
        },
        set: function(newData) {
            this.data = newData;
        },
        assocNameToFile: function(name, file) {
            this.pathToFileMap[name] = file;
        },
        setCurrentImage: function(path) {
            this.data.currentImage = path;
        },
        getCurrentImage: function() {
            if (!this.data.currentImage) {
                this.data.currentImage = this.data[0].name;
            }
            return this.data.currentImage;
        },
        getURL: function(n) {
            return this.get()[n].url;
        },
        getFile: function(n) {
            try {
                var name = this.get()[n].name;
                return this.pathToFileMap[name];
            } catch (e) {
                return null;
            }
        },
        getLoadedSoFar: function() {
            return model.loadedSoFar;
        },
        addTagToImgRect: function(tagId, imgId, rectId) {
            model.data[imgId].rects[rectId].tag = model.getTagString(tagId);
        },
        setFile: function(file, n, imageCount) {
            model.loadedSoFar++;
            this.data[n] = {
                file: file,
                rects: []
            };
            this.data.imageCount++;
        },
        getName: function(n) {
            return this.get()[n].name;
        },
        initImgWithName: function(name, n) {
            model.loadedSoFar++;
            this.get()[n] = {
                name: name,
                rects: []
            };
            this.data.imageCount++;
        },
        setRect: function(n, trueRect) {
            if (!this.data[n])
                this.data[n] = {
                    rects: trueRect
                };
            else
                this.data[n].rects = trueRect;
        },
        writeTagSet: function(tagSet) {
            this.tags = tagSet;
        },
        getTagSet: function() {
            return this.tags;
        },
        getTagString: function(tagId) {
            return this.tags[tagId];
        },
        getLength: function() {
            return this.data.imageCount;
        }
    };
    var view; // Current view
    var filepickingView = {
        panel: $('filepicking-panel'),
        init: function() {
            this.panel.css('display', 'block');
            this.bindEvents();
        },
        bindEvents: function() {
            $('#files').change(function() {
                var vanillaObj = this;
                $('#files-filecount').text(vanillaObj.files.length + " files selected");
            });
            $('#json-selector').change(function() {
                var vanillaObj = this;
                $('#json-selector-filecount').text(vanillaObj.files.length + " file selected");
            });
            $f.submit(function(e) {
                e.preventDefault();
                controller.switchToHighlight();
            });
        },
        deinit: function() {
            this.panel.css('display', 'none');
        }
    };
    var highlightView = {
        currImage: 0,
        initialized: false,
        panel: $('highlighting-panel'),
        init: function() {
            this.panel.css('display', 'block');
            view.applyRectModifiers();
            if (!controller.bufferLoaded) {
                this.bindEvents();
                console.log('starting bufffer');
                controller.startBuffer();
                this.render();
                this.initialized = true;
            }
        },
        bindEvents: function() {
            $('#nextButton').click(function(event) {
                controller.storeRect(view.currImage);
                view.resetAllRects(true);
                if (view.currImage + 1 < controller.getLength()) {
                    view.currImage++;
                    controller.shiftCurrentImage(1);
                    view.render(1);
                    controller.shiftWindow(1);
                }
            });
            $(window).resize(function() {
                view.setRects();
            });
            $('#prevButton').click(function(event) {
                controller.storeRect(view.currImage);
                if (view.currImage - 1 >= 0) {
                    view.currImage--;
                    controller.shiftCurrentImage(-1);
                    view.render(-1);
                    controller.shiftWindow(-1);
                }
            });
            $('#classifyButton').click(function(event) {
                controller.storeRect(view.currImage);
                controller.switchToView(classifyView);
            });
            $('#addRectButton').click(function(event) {
                controller.addRect();
            });
            $('#getDownloadLink').click(function(event) {
                controller.showDownloadLink();
            });
            $('#selectorImage').click(function(event) {
                view.addRectCenteredAt(event.pageX, event.pageY, defaultSquareRadius);
            });
            $(document).keydown(function(event) {
                function subtractRadius(ind, val) {
                    return parseFloat(val) - radiusResizeIncrement;
                }

                function subtract2Radius(ind, val) {
                    return subtractRadius(0, subtractRadius(ind, val));
                }

                function subPos(ind, coords) {
                    var newCoords = {
                        top: coords.top - radiusResizeIncrement,
                        left: coords.left - radiusResizeIncrement
                    };
                    var imgCoords = $(selectorImage).offset();
                    if (newCoords.top < imgCoords.top)
                        newCoords.top = imgCoords.top;
                    if (newCoords.left < imgCoords.left)
                        newCoords.left = imgCoords.left;
                    return newCoords;
                }

                function addPos(ind, coords) {
                    return {
                        top: coords.top + radiusResizeIncrement,
                        left: coords.left + radiusResizeIncrement
                    };
                }

                function addWidth(ind, width) {
                    // Square has already been shifted in position
                    width = parseFloat(width);
                    var newWidth = width + radiusResizeIncrement * 2;
                    var newSquareRight = this.offsetLeft + newWidth;
                    var imgRight = selectorImage.offsetLeft + selectorImage.width;
                    if (newSquareRight > imgRight) {
                        newWidth = imgRight - this.offsetLeft;
                    }
                    return newWidth;
                }

                function addHeight(ind, height) {
                    height = parseFloat(height);
                    // Square has already been shifted in position
                    var newHeight = height + radiusResizeIncrement * 2;
                    var newSquareBottom = this.offsetTop + newHeight;
                    var imgBottom = selectorImage.offsetTop + selectorImage.height;
                    if (newSquareBottom > imgBottom) {
                        newHeight = imgBottom - this.offsetTop;
                    }
                    return newHeight;
                }

                function addRadius(ind, val) {
                    return parseFloat(val) + radiusResizeIncrement;
                }

                function add2Radius(ind, val) {
                    return addRadius(0, addRadius(ind, val));
                }
                switch (event.which) {
                    case 80:
                        $('.selection-square:focus')
                            .offset(subPos)
                            .css('width', addWidth)
                            .css('height', addHeight);
                        break;
                    case 79:
                        $('.selection-square:focus').css('top', addRadius)
                            .css('left', addRadius)
                            .css('width', subtract2Radius)
                            .css('height', subtract2Radius);
                        break;
                    case 73:
                        $('#nextButton').click();
                        break;
                    case 85:
                        $('#prevButton').click();
                        break;
                    case 222:
                        $('#getDownloadLink').click();
                        break;
                    case 13:
                        $('#downloadLink').click();
                        break;
                }
            });
            $('.selection-square').dblclick(function(event) {
                this.remove();
            });
        },
        deinit: function() {
            this.panel.hide();
        },
        dataUrlOfCrop: function(rect) {
            var cvv = $('#cropper')[0];
            var img = $('#selectorImage')[0];
            cvv.width = rect.width;
            cvv.height = rect.height;
            var cv = cvv.getContext('2d');
            cv.drawImage(img, rect.left, rect.top, rect.width, rect.height, 0, 0, cvv.width, cvv.height);
            return cvv.toDataURL();
        },
        getRects: function() {
            var $sqs = $('.selection-square');
            var rects = [];
            $sqs.each(function(i) {
                var $sq = $(this);
                var pos = $sq.offset();
                pos.left = view.rx(pos.left);
                pos.top = view.ry(pos.top);
                var rect = {
                    top: view.scaledToRealY(pos.top),
                    left: view.scaledToRealX(pos.left),
                    width: view.scaledToRealX(parseFloat($sq.css('width'))),
                    height: view.scaledToRealY(parseFloat($sq.css('height')))
                };
                rect.url = view.dataUrlOfCrop(rect);
                rect.realWidth = parseFloat($sq.css('width'));
                rect.realHeight = parseFloat($sq.css('height'));
                rects.push(rect);
            });
            return rects;

        },
        setRects: function() {
            view.resetAllRects(true);
            var imgObj = controller.getImageObject(view.currImage);
            var panel = $('highlighting-panel');
            var rect;
            if (imgObj.rects)
                for (var i = 0; i < imgObj.rects.length; i++) {
                    rect = imgObj.rects[i];
                    var newRect = $('<div class="selection-square"></div>');
                    newRect.css({
                        'width': view.realToScaledX(rect.width),
                        'height': view.realToScaledY(rect.height),
                        'top': view.storedToTrueY(rect.top),
                        'left': view.storedToTrueX(rect.left)
                    });
                    panel.prepend(newRect);
                }
            console.log('initImgWithName');
            view.applyRectModifiers();
        },
        addRectCenteredAt: function(x, y, radius) {
            var trueLeft = Math.max(selectorImage.offsetLeft, x - radius);
            var trueTop = Math.max(selectorImage.offsetTop, y - radius);
            var trueWidth = Math.min(selectorImage.offsetLeft + selectorImage.width - trueLeft, radius * 2);
            var trueHeight = Math.min(selectorImage.offsetTop + selectorImage.height - trueTop, radius * 2);
            view.drawAndFocusRect(trueLeft, trueTop, trueWidth, trueHeight);
        },
        drawAndFocusRect: function(x, y, width, height) {
            var toPrepend = $('<div class="selection-square"></div>');
            toPrepend.css({
                'width': width,
                'height': height,
                'top': y,
                'left': x
            });
            $('highlighting-panel').prepend(toPrepend);
            setTimeout(function() {
                toPrepend.get(0).focus();
            }, 10);
            console.log('fous');
            view.applyRectModifiers();
        },
        showDownloadLink: function(url) {
            $('#downloadLink').attr('href', url);
            $('#downloadLink').show();
        },
        render: function(dir) {
            var _ = controller.getURL(dir);
            var path = _[1];
            var url = _[0];
            $('#selectorImage').attr('src', url);
            $('#imageName').text(path);
            console.log('render');
            view.setRects();
        },
        rx: function(x) {
            return x - selectorImage.offsetLeft;
        },
        ry: function(y) {
            console.log('using scrollTop');
            return y - selectorImage.offsetTop;
        },
        trueX: function(x) {
            return x + selectorImage.offsetLeft;
        },
        trueY: function(y) {
            return y + selectorImage.offsetTop;
        },
        realToScaledX: function(dim) {
            return dim * selectorImage.width / selectorImage.naturalWidth;
        },
        scaledToRealX: function(dim) {
            return dim * selectorImage.naturalWidth / selectorImage.width;
        },
        realToScaledY: function(dim) {
            return dim * selectorImage.height / selectorImage.naturalHeight;
        },
        scaledToRealY: function(dim) {
            return dim * selectorImage.naturalHeight / selectorImage.height;
        },
        storedToTrueX: function(dim) {
            return view.trueX(view.realToScaledX(dim));
        },
        storedToTrueY: function(dim) {
            return view.trueY(view.realToScaledY(dim));
        },
        addRect: function() {
            $('highlighting-panel').prepend('<div class="selection-square"></div>');
            view.applyRectModifiers();
        },
        applyRectModifiers: function() {
            $('.selection-square').draggable({
                stop: function() {
                    controller.storeRect(view.currImage);
                },
                drag: function(event, ui) {
                    var imgRight = selectorImage.offsetLeft + selectorImage.width;
                    var imgBottom = selectorImage.offsetTop + selectorImage.height;
                    ui.position.left = Math.min(imgRight - parseFloat($(this).css('width')), Math.max(selectorImage.offsetLeft, ui.offset.left));
                    ui.position.top = Math.min(imgBottom - parseFloat($(this).css('height')), Math.max(selectorImage.offsetTop, ui.offset.top));
                }
            }).resizable({
                resize: function(event, ui) {
                    var imgRight = selectorImage.offsetLeft + selectorImage.width;
                    var imgBottom = selectorImage.offsetTop + selectorImage.height;
                    ui.size.width = Math.min(imgRight - this.offsetLeft, ui.size.width);
                    ui.size.height = Math.min(imgBottom - this.offsetTop, ui.size.height);
                }
            }).resize(function(event) {
                event.stopPropagation();
            });;
            $('.selection-square').dblclick(function(event) {
                this.remove();
            });
            $('.selection-square').attr('tabindex', '-1');
        },
        resetAllRects: function(noAdd) {
            $('.selection-square').each(function(index) {
                $(this).remove();
            });
            if (!noAdd)
                view.addRect();
        }
    };
    var classifyView = {
        panel: $('classify-panel'),
        init: function() {
            this.panel.css('display', 'block');
            console.log('rendering');
            this.render();
            this.applyModifiers();
            this.applyEventHandlers();
        },
        deinit: function() {
            this.panel.css('display', 'none');
            $(document).off("keypress");
        },
        render: function() {
            var grid = $('.image-grid');
            grid.empty();
            for (var n = 0; n < controller.getLength(); n++) {
                console.log('imaging');
                if (controller.rectsForImg(n))
                    for (var i = 0, rects = controller.rectsForImg(n); i < rects.length; i++) {
                        if (rects[i].url) {
                            var thumbnail = $('<div class="thumbnail" data-tooltip="No tags set"></div>');
                            thumbnail.attr('data-imgid', n);
                            thumbnail.attr('data-rectid', i);
                            thumbnail.css({
                                'height': rects[i].realHeight * 2,
                                'width': rects[i].realWidth * 2
                            });
                            grid.append(thumbnail);
                            thumbnail.css('background-image', u.cssURL(rects[i].url));
                        }
                    }
            }
            var tagList = $('.tag-list');
            tagList.empty();
            controller.getTagSet().forEach(function(tag, id) {
                var tagSpan = $('<button class="btn btn-default tag-btn"></button>');
                tagSpan.text(id + 1 + ": " + tag);
                tagSpan.attr('data-tagid', id);
                tagList.append(tagSpan);
                tagSpan.css('color', 'white');
                tagSpan.css('background-color', u.getColor(id));
            });
        },
        realToScaledX: function(x) {
            return $('.image-grid').attr('width') / 10;
        },
        getThumb: function(id) {
            return $('.thumb[data-imgid=' + id + ']');
        },
        getBtn: function(id) {
            return $('.btn[data-tagid=' + id + ']');
        },
        addTagToThumbnail: function(tagElem, thumbElem) {
            //     var newTitle = thumbElem.attr('data-tooltip') + tagElem[0].outerHTML;
            //     console.log('new title '+newTitle);
            //     thumbElem.attr('data-tooltip', newTitle);
            //     thumbElem.tooltip();
            thumbElem.remove();
            //     Eventually make this add HTML to display tag BADGE, not just text
        },
        tagSelected: function(tagElem) {
            $('.ui-selected').each(function() {
                controller.applyTagToThumbnail(tagElem, $(this));
            });
        },
        applyModifiers: function() {
            $.widget("ui.tooltip", $.ui.tooltip, {
                options: {
                    content: function() {
                        return $(this).attr('data-tooltip');
                    }
                }
            });
            $('.image-grid').selectable();
            $('.thumbnail').each(function() {
                $(this).tooltip();
            });
        },
        applyEventHandlers: function() {
            $('.tag-btn').click(function(event) {
                view.tagSelected($(this));
            });
            $('#boxButton').click(function(event) {
                controller.switchToView(highlightView);
            });
            $(document).keypress(function(event) {
                console.log('key press');
                var number = String.fromCharCode(event.which);
                view.getBtn(number - 1).click();
            });
        }
    };
    var u = {
        COLORS: [
            "A32929", "B1365F", "7A367A", "5229A3", "29527A", "2952A3", "1B887A",
            "28754E", "0D7813", "528800", "88880E", "AB8B00", "BE6D00", "B1440E",
            "865A5A", "705770", "4E5D6C", "5A6986", "4A716C", "6E6E41", "8D6F47",
            "853104", "691426", "5C1158", "23164E", "182C57", "060D5E", "125A12",
            "2F6213", "2F6309", "5F6B02", "875509", "8C500B", "754916", "6B3304",
            "5B123B", "42104A", "113F47", "333333", "0F4B38", "856508", "711616",
        ],
        cssURL: function(url) {
            return 'url(' + url + ')';
        },
        getRandomColor: function() {
            // 30 random hues with step of 12 degrees
            var hue = Math.floor(Math.random() * 30) * 12;
            return $.Color({
                hue: hue,
                saturation: 0.9,
                lightness: 0.6,
                alpha: 1
            }).toHexString();
        },
        getColor: function(n) {
            return '#' + u.COLORS[n];
        }
    };
    var controller = {
        fileToUrlMap: {},
        loadedSoFar: 0,
        imageCount: 0,
        fileWindow: [],
        bufferLoaded: false,
        bufferCenterModelId: 0,
        init: function() {
            view = filepickingView;
            model.init();
            view.init();
        },
        setCurrentImage: function(n) {
            model.setCurrentImage(n);
        },
        setImageCount: function(n) {
            this.imageCount = n;
        },
        startBufferAt: function(n) {
            for (var i = n - buffer, j = 0; i < n + buffer; i++, j++) {
                if (model.getFile(i)) {
                    this.fileWindow.push(model.getFile(i));
                } else {
                    this.fileWindow.push(null);
                }
            }
            for (var i = 0; i < this.fileWindow.length; i++) {
                var file = this.fileWindow[i];
                if (file) {
                    var fr = new FileReader();
                    fr.onload = controller.addToMapGenerator(file);
                    fr.readAsDataURL(file);
                } else {
                    controller.fileToUrlMap[null] = null;
                }
            }
            this.bufferLoaded = true;
        },
        startBuffer: function() {
            var path = model.getCurrentImage();
            var n;
            for (var i = 0, file = model.getFile(i); i < controller.imageCount; i++, file = model.getFile(i)) {
                if (file.webkitRelativePath === path) {
                    console.log(file.webkitRelativePath);
                    n = i;
                    break;
                }
            }
            this.startBufferAt(n);
        },
        switchToHighlight: function() {
            var fileList = document.getElementById('files').files;
            var jsonDataFile = document.getElementById('json-selector').files[0];
            var imageList = [];
            var fl = fileList.length;
            controller.writeTagSet([]);
            var file;
            // This should be in the controller
            for (var i = 0; i < fl; i++) {
                file = fileList[i];
                var reader = new FileReader();
                if (file.name == labelsFileName) {
                    reader.onload = function(e) {
                        var trimmed = $.trim(e.target.result);
                        var tags = trimmed.split('\n');
                        controller.writeTagSet(tags);
                    };
                    reader.readAsText(file);
                } else {
                    imageList.push(file);
                }
            }
            controller.setImageCount(imageList.length);
            for (var j = 0; j < imageList.length; j++) {
                file = imageList[j];
                controller.addImgAssoc(file, j, file.webkitRelativePath);
            }
            try {
                controller.readJsonFileThenHighlight(jsonDataFile);
            } catch (e) {
                for (var i = 0; i < imageList.length; i++) {
                    file = imageList[i];
                    controller.addImg(file.webkitRelativePath, i);
                }
                controller.switchToView(highlightView);
            }
        },
        switchToView: function(newView) {
            view.deinit();
            view = newView;
            newView.init();
        },
        getURL: function(dir) {
            var path = this.fileWindow[buffer + dir].webkitRelativePath;
            return [this.fileToUrlMap[path],
                path
            ];
        },
        addToMapGenerator: function(file) {
            return function(e) {
                controller.fileToUrlMap[file.webkitRelativePath] = e.target.result;
            };
        },
        dataGenerator: function(ctx) {
            return function(e) {
                var newData = JSON.parse(e.target.result);
                model.set(newData);
                console.log(model.get());
                controller.switchToView(highlightView);
            };
        },
        readToMap: function(file) {
            var fr = new FileReader();
            fr.onload = this.addToMapGenerator(file);
            fr.readAsDataURL(file);
        },
        readJsonFileThenHighlight: function(file) {
            var fr = new FileReader();
            fr.onload = this.dataGenerator();
            fr.readAsText(file);
        },
        shiftCurrentImage: function(dir) {
            // Update model.data.currentImage;
            this.setCurrentImage(this.fileWindow[buffer + dir].webkitRelativePath);
        },
        shiftWindow: function(dir) {
            var fl;
            var first;
            if (dir > 0) {
                fl = model.getFile(this.bufferCenterModelId + buffer);
                this.fileWindow.push(fl);
                // ADD ACTUAL FILE READING HERE
                if (fl)
                    this.readToMap(fl);
                this.bufferCenterModelId++;
                first = this.fileWindow.shift();
                if (first)
                    delete this.fileToUrlMap[first.webkitRelativePath];
            } else if (dir < 0) {
                fl = model.getFile(this.bufferCenterModelId - buffer - 1);
                this.fileWindow.unshift(fl);
                if (fl)
                    this.readToMap(fl);
                this.bufferCenterModelId--;
                first = this.fileWindow.pop();
                if (first)
                    delete this.fileToUrlMap[first.webkitRelativePath];
            }
        },
        getNextURL: function(dir) {
            this.shiftWindow(dir);
            return this.getURL();
        },
        addImgAssoc: function(file, n, name) {
            model.assocNameToFile(name, file);
        },
        addImg: function(name, n) {
            model.initImgWithName(name, n);
        },
        getImageObject: function(n) {
            return model.get()[n];
        },
        getLength: function() {
            return model.getLength();
        },
        storeRect: function(n) {
            model.setRect(n, view.getRects());
        },
        //   addRect: function() {
        //     view.addRect();
        //   },
        showDownloadLink: function() {
            // to copy it completely
            var writeObject = JSON.parse(JSON.stringify(model.get()));
            delete writeObject.tags;
            for (var n in writeObject) {
                if (!isNaN(n)) {
                    var img = writeObject[n];
                    delete writeObject[n].file;
                    if (writeObject[n].rects) {
                        if (writeObject[n].rects.length === 0)
                            delete writeObject[n].rects;
                        for (var j in img.rects) {
                            delete img.rects[j].url;
                        }
                    }
                    delete writeObject[n].url;
                }
            }
            var url = 'data:application/json,' +
                encodeURIComponent(JSON.stringify(writeObject));
            view.showDownloadLink(url);
        },
        writeTagSet: function(tagSet) {
            model.writeTagSet(tagSet);
        },
        getTagSet: function() {
            console.log(model.getTagSet());
            return model.getTagSet();
        },
        tagsForImg: function(n) {
            return model.get()[n].tags;
        },
        rectsForImg: function(n) {
            return model.get()[n].rects;
        },
        tagStrings: function(ids) {
            var strings = [];
            ids.forEach(function(id) {
                strings.push(model.getTagString(id));
            });
            return strings;
        },
        applyTagToThumbnail: function(tagElem, thumb) {
            var imgId = thumb.attr('data-imgid');
            var rectId = thumb.attr('data-rectid');
            var tagId = tagElem.attr('data-tagid');
            model.addTagToImgRect(tagId, imgId, rectId);
            view.addTagToThumbnail(tagElem, thumb);
        }
    };
    controller.init();
});