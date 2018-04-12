$(function(){

    showLoading();

    var host   = 'ws://127.0.0.1:8889';
    var socket = null;

    $.ajax({
        url: "http://localhost:8000/files",
        type: "GET",
        error: function(result, status, error) {
            console.log("result", result); 
            console.log("status", status);
            console.log("error", error);
        },
        complete: function(result, status) {
            var files = result.responseJSON;
            console.log(result.responseJSON);

            appendFiles(files);
            hideLoading();
        }
    });

    $("#upload_file").on('change', function(event){
        var file = event.target.files[0];
        console.log(file);

        var fileObject = {
            "size": file.size,
            "contentType": file.name.split(".")[1],
            "name" : file.name.split(".")[0]
        };

        $.ajax({
            url: "http://localhost:8000/files",
            type: "POST",
            data : JSON.stringify(fileObject),
            dataType: "application/json",
            complete: function (result, status) {
                if(result.status === 200) {
                    fileObject = JSON.parse(result.responseText);
                    parseFile(event.target.files[0], fileObject.uuid);
                }
            }
        });
    });

    try {
        socket = new WebSocket(host);
        socket.onopen = function () {
            
        };

        socket.onmessage = function (msg) {
            manageAction(JSON.parse(msg.data));
            return;
        };

        socket.onclose = function () {
            return;
        };

    } catch (e) {
        console.log(e);
    }

    function appendFiles(files) {
        var $container = $(".files_container");

        for(var i = 1; i <= files.length; i++) {
            appendFile($container, files[i-1], true)
        }
    }

    function manageAction(data){
        var method = data.method;
        var status = data.status;
        var $container = $(".files_container");

        if (method == null || status == null) {
            return;
        }

        switch (method) {
            case "create" : 
                if (status === "loading") {
                    var file = data.file;
    
                    appendFile($container, file, false)
                }
                if (status === "finished") {
                    var uuid = data.file.uuid;
                    var $file = $("#file-"+uuid);

                    $("#hide-"+uuid).remove();

                    $file.on('click', function(event){
                        console.log(this);
                    })
                }
                break;
        }
    }

    function appendFile(container, file, ready) {

        var $file = $(
            "<div id='file-" + file.uuid +"' class='file'> \
                <img src='lib/img/" + file.contentType + ".png'> \
                <div class='name' id='name-" + file.uuid +"'>" + file.name + "</div> \
                <span class='mdl-tooltip mdl-tooltip--large' data-mdl-for='name-" + file.uuid +"'>"
                    + file.name +
                "</span> \
            </div>");

        container.append($file);

        if (!ready) {
            $file.append("<div id='hide-" + file.uuid +"' class='hide_file'></div>");
        } else {
            $file.on('click', function(event){
                console.log(this);
            })
        }

        componentHandler.upgradeDom();  
    }

    function parseFile(file, uuid) {

        var fileSize   = file.size;
        var chunkSize  = 1000000; // 1MB
        var offset     = 0;
        var position   = 0;
        var chunkReaderBlock = null;

        var readEventHandler = function(evt) {
            console.log(evt);
            if (evt.target.error == null) {
                offset += chunkSize;
                content = btoa(evt.target.result, true);

                var chunk = {
                    "uuid": uuid,
                    "position": position,
                    "content": content,
                    "md5": md5(content)
                };

                if (offset >= fileSize) {
                    sendLastChunk(chunk);
                    console.log("last chunk", chunk);
                    console.log("Done reading file");
                    return;
                }

                sendChunk(chunk);

            } else {
                console.log("Read error: " + evt.target.error);
                return;
            }

            position++;

            // of to the next chunk
            chunkReaderBlock(offset, chunkSize, file);
        };

        chunkReaderBlock = function(_offset, length, _file) {
            var r = new FileReader();
            console.log(_file.size);
            var blob = _file.slice(_offset, length + _offset);
            console.log(blob);
            r.onload = readEventHandler;
            r.readAsBinaryString(blob);
        };

        // now let's start the read with the first block
        chunkReaderBlock(offset, chunkSize, file);
    }

    function sendChunk(chunk){
        $.ajax({
            url: "http://localhost:8000/chunks",
            type: "POST",
            data : JSON.stringify(chunk),
            dataType: "application/json",
            async: false,
            complete: function (result, status) {
                if(result.status === 200) {
                    console.log("chunk", JSON.parse(result.responseText));
                }
            }
        });
    }

    function sendLastChunk(chunk){
        $.ajax({
            url: "http://localhost:8000/chunks/last",
            type: "POST",
            data : JSON.stringify(chunk),
            dataType: "application/json",
            async: false,
            complete: function (result, status) {
                if(result.status === 200) {
                    console.log("last chunk", JSON.parse(result.responseText));
                }
            }
        });
    }

});