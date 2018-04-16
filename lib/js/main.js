$(function(){
    showLoading();

    var $errorChip = $("#error-chip");
    var url = 'http://127.0.0.1/Filer/public';
    var host   = 'ws://127.0.0.1:8889';
    var socket = null;
    var files = [];

    $("#input-search").val("");

    $("#input-search").on('keyup', function(event){
        var filteredFiles = files.slice(0);
        var filter = $(this).val().toLowerCase();

        files.forEach(element => {
            if (!(element.name.toLowerCase().includes(filter))) {
                filteredFiles.splice(filteredFiles.indexOf(element), 1);
            }
        });

        appendFiles(filteredFiles);
    });

    $("#hide-chip").on('click', function(event){
        $(this.parentNode.parentNode).css('visibility', 'hidden');
    });

    FileObject.getAll(appendFiles, displayError, _saveFiles);

    $("#upload_file").on('change', function(event){
        var blob = event.target.files[0];
        var file = new FileObject(null, blob.name, blob.size, blob.type);

        FileObject.create(JSON.stringify(file.serialize()), blob, parseFile, displayError, _addFile);
    });

    try {
        socket = new WebSocket(host);
        socket.onmessage = function (msg) {
            manageAction(JSON.parse(msg.data));
            return;
        };
    } catch (e) {
        displayError(e);
    }

    function appendFiles(files) {
        var $container = $(".files_container");
        $container.empty();

        for(var i = 1; i <= files.length; i++) {
            appendFile($container, files[i-1], true)
        }
    }

    function manageAction(data){
        var method = data.method;
        var status = data.status;
        var $container = $(".files_container");

        if (status === "finished") {
            var uuid = data.file.uuid;
            var $file = $("#file-"+uuid);

            $("#hide-"+uuid).remove();
            $("#loader-"+uuid).remove();

            $file.off();
            $file.on('click', function(event){
                window.open("http://localhost/Filer/public/download/" + uuid, '_blank');
            });
            
        }

        switch (method) {
            case "create" : 
                appendFile($container, data.file, false);
                break;
            case "delete" :
                removeFile(data.uuid);
                break;
            case "update" : 
                updateFile(data.file);
                break;
        }
    }

    function appendFile(container, file, ready) {

        var $file = $(
            "<div id='file-" + file.uuid +"' class='file'> \
                <img id='img-" + file.uuid +"' src='lib/img/" + getIconeName(file.contentType) + ".png'> \
                <div class='name' id='name-" + file.uuid +"'>" + file.name + "</div> \
                <span id='tooltip-" + file.uuid +"' class='mdl-tooltip mdl-tooltip--large' data-mdl-for='name-" + file.uuid +"'>"
                    + file.name +
                "</span> \
                <div class='icon' id='trash-"+file.uuid+"'>\
                    <i class='fas fa-trash-alt fa-1x'></i>\
                </div>\
                <span id='tooltip-trash-" + file.uuid +"' class='mdl-tooltip mdl-tooltip--large' data-mdl-for='trash-" + file.uuid +"'>"
                    + "Delete this file" +
                "</span> \
                <div class='icon' id='copy-"+file.uuid+"'>\
                    <i class='fas fa-copy fa-1x'></i>\
                </div>\
                <span id='tooltip-copy-" + file.uuid +"' class='mdl-tooltip mdl-tooltip--large' data-mdl-for='copy-" + file.uuid +"'>"
                    + "Copy link to download the file" +
                "</span> \
                <div class='icon' id='check-"+file.uuid+"'>\
                    <i class='fas fa-check-circle fa-1x'></i>\
                </div>\
                <label class='icon' for='upload-"+file.uuid+"' id='edit-"+file.uuid+"'>\
                    <i class='fas fa-edit fa-1x'></i>\
                    <input type='file' id='upload-"+file.uuid+"'>\
                </label>\
                <span id='tooltip-edit-" + file.uuid +"' class='mdl-tooltip mdl-tooltip--large' data-mdl-for='edit-" + file.uuid +"'>"
                    + "Replace this file by another file" +
                "</span> \
            </div>");

        container.append($file);

        $("#check-" + file.uuid).css("display", "none");

        $("#upload-"+file.uuid).on('change', function(event){
            var blob = event.target.files[0];
            var newFile = new FileObject(file.uuid, blob.name.split(".")[0], blob.size, blob.type);
            showDialog({
                title: 'Modify '+file.name,
                text: 'Are you sure wanting to replace this file by '+newFile.name+' ?',
                negative: {
                    title: 'No'
                },
                positive: {
                    title: 'Yes',
                    onClick: function (e) {
                        FileObject.update(newFile.serialize(), blob, parseFile, displayError, _updateFile);
                    }
                }
            });
            
        });

        $("#trash-"+file.uuid).on('click', function(event){
            showDialog({
                title: 'Delete '+file.name,
                text: 'Are you sure wanting to delete this file ?',
                negative: {
                    title: 'No'
                },
                positive: {
                    title: 'Yes',
                    onClick: function (e) {
                        FileObject.delete(file.uuid, removeFile, displayError, _removeFile);
                    }
                }
            });
            event.stopPropagation();
        });

        $("#edit-"+file.uuid).on('click', function(event){
            event.stopPropagation();
        });

        $("#copy-"+file.uuid).on('click', function(event){
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val("http://localhost/Filer/public/download/" + file.uuid).select();
            document.execCommand("copy");
            $temp.remove();
            $("#copy-" + file.uuid).css("display", "none");
            $("#check-" + file.uuid).css("display", "block");
            $("#check-" + file.uuid).fadeOut( 1500, function() {
                $("#copy-" + file.uuid).css("display", "block");
              });
            event.stopPropagation();
        });

        if (!ready) {
            $file.append("<div id='hide-" + file.uuid +"' class='hide_file'></div>");
            $file.append("<div id='loader-"+file.uuid+"' class='mdl-progress mdl-js-progress'></div>");
            $("#loader-"+file.uuid).on('mdl-componentupgraded', function() {
                this.MaterialProgress.setProgress(0);
                this.MaterialProgress.setBuffer(0);
              });
            $("#hide-"+file.uuid).on('click', function(event) {
                event.stopPropagation();
            });
        } else {
            $file.on('click', function(event){
                window.open("http://localhost/Filer/public/download/" + file.uuid, '_blank');
            });
        }
        componentHandler.upgradeAllRegistered();
    }

    function parseFile(file, uuid) {

        var fileSize   = file.size;
        var chunkSize  = 1000000; // 1MB
        var offset     = 0;
        var position   = 0;
        var chunkReaderBlock = null;
        var chunks = [];

        var readEventHandler = function(evt) {
            if (evt.target.error == null) {
                offset += chunkSize;
                var content = btoa(evt.target.result);

                var chunk = {
                    "uuid": uuid,
                    "position": position,
                    "content": content,
                    "md5": md5(content)
                };
                
                chunks.push(chunk);

                if (offset >= fileSize) {
                    sendChunks(chunks);
                    return;
                }

            } else {
                return;
            }

            position++;

            // of to the next chunk
            chunkReaderBlock(offset, chunkSize, file);
        };

        chunkReaderBlock = function(_offset, length, _file) {
            var r = new FileReader();
            var blob = _file.slice(_offset, length + _offset);
            r.onload = readEventHandler;
            r.readAsBinaryString(blob);
        };

        // now let's start the read with the first block
        chunkReaderBlock(offset, chunkSize, file);
    }

    function sendChunks(chunks){
        if (chunks.length === 0) return;
        var url = "http://localhost/Filer/public/chunks";
        if (chunks.length === 1) url += "/last";

        var loader = $("#loader-"+chunks[0].uuid)[0].MaterialProgress;
        var $bufferBar = $(loader.bufferbar_);
        var $progressBar = $(loader.progressbar_);

        var progressed = parseInt($progressBar.attr("style").replace("width: ", "").replace("%;", ""));
        var remainingProgress = 100-progressed;

        loader.setBuffer(progressed + remainingProgress/chunks.length);

        $.ajax({
            url: url,
            type: "POST",
            data : JSON.stringify(chunks[0]),
        }).done((data, status, response) => {
            loader.setProgress(progressed + remainingProgress/chunks.length);
            chunks.splice(0, 1);
            sendChunks(chunks);
        }).fail((request, status, messageError) => {
            
        });
    }

    function removeFile(uuid){
        $("#file-"+uuid).remove();
    }

    function getIconeName(contentType){
        var extension = contentType;
        if (extension.includes("opendocument") || extension.includes("msword")) return "doc";
        if (extension === "text/plain") return "txt"
        if (extension.includes("presentation")) return "ppt";
        if (extension.includes("ms-excel")) return "csv";
        if (extension.includes("spreadsheetml")) return "xls";
        if (extension.includes("zip")) return "zip";
        

        return extension.split("/")[1];
    }

    function updateFile(file){
        $file = $("#file-"+file.uuid);
        $file.append("<div id='hide-" + file.uuid +"' class='hide_file'></div>");
        $file.append("<div id='loader-"+file.uuid+"' class='mdl-progress mdl-js-progress'></div>");
            $("#loader-"+file.uuid).on('mdl-componentupgraded', function() {
                this.MaterialProgress.setProgress(0);
                this.MaterialProgress.setBuffer(0);
              });
        componentHandler.upgradeAllRegistered();
        $("#hide-"+file.uuid).on('click', function(event) {
            event.stopPropagation();
        });
        $("#tooltip-"+file.uuid).text(file.name);
        $("#name-"+file.uuid).text(file.name);
        $("#img-"+file.uuid).attr("src", "lib/img/" + getIconeName(file.contentType) + ".png");
    }

    function displayError(error){
        $errorChip.text(error);

        $($($errorChip.parent()).parent()).css('visibility', "visible");
    }

    function _saveFiles(_files){
        files = _files;
    }

    function _addFile(_file){
        files.push(_file);
    }

    function _removeFile(_uuid){
        files = files.filter(function(element){
            return element.uuid != _uuid;
        });
    }

    function _updateFile(_file){
        index = files.map(function(e) { return e.uuid; }).indexOf(_file.uuid);
        files[index] = _file;        
    }

});