class FileObject {

    constructor(uuid, name, size, contentType) {
        this.uuid = uuid;
        this.name = name;
        this.size = size;
        this.contentType = contentType;
    }

    static getAll(appendFiles){
        $.ajax({
            url: "http://localhost/Filer/public/files",
            type: "GET"
        }).done((data, status, response) => {
            var files = data;
            appendFiles(files);
            hideLoading();
        }).fail((request, status, messageError) => {
            //console.log("request", request, "status", status);
        });
    }

    static create(data, blob, parseFile){
        $.ajax({
            url: "http://localhost/Filer/public/files",
            type: "POST",
            data : data
        }).done((data, status, response) => {
            var file = data;
            parseFile(blob, file.uuid);
        }).fail((request, status, messageError) => {
            //console.log("request", request, "status", status, "msg", messageError);
        });
    }

    static delete(uuid, removeFile){
        $.ajax({
            url: "http://localhost/Filer/public/files/"+uuid,
            type: "DELETE"
        }).done((data, status, response) => {
        }).fail((request, status, messageError) => {
            //console.log("request", request, "status", status, "msg", messageError);
        });
    }

    static update(file, blob, parseFile){
        $.ajax({
            url: "http://localhost/Filer/public/files/"+file.uuid,
            type: "PATCH",
            data: JSON.stringify(file)
        }).done((data, status, response) => {
            var file = data;
            parseFile(blob, file.uuid);
        }).fail((request, status, messageError) => {
            //console.log("request", request, "status", status, "msg", messageError);
        });
    }
    
    serialize() {
        return {
            "uuid": this.uuid,
            "name": this.name,
            "size": this.size,
            "contentType": this.contentType
        };
    }
}