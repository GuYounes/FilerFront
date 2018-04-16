class FileObject {

    constructor(uuid, name, size, contentType) {
        this.uuid = uuid;
        this.name = name;
        this.size = size;
        this.contentType = contentType;
    }

    static getAll(appendFiles, displayError, saveFiles){
        $.ajax({
            url: "http://localhost/Filer/public/files",
            type: "GET"
        }).done((data, status, response) => {
            saveFiles(data);
            appendFiles(data);
            hideLoading();
        }).fail((request, status, messageError) => {
            hideLoading();
            displayError("Error : "+messageError);
        });
    }

    static create(data, blob, parseFile, displayError, addFile){
        $.ajax({
            url: "http://localhost/Filer/public/files",
            type: "POST",
            data : data
        }).done((data, status, response) => {
            var file = data;
            addFile(file);
            parseFile(blob, file.uuid);
        }).fail((request, status, messageError) => {
            displayError("Error : "+messageError);
        });
    }

    static delete(uuid, removeFile, displayError, _removeFile){
        $.ajax({
            url: "http://localhost/Filer/public/files/"+uuid,
            type: "DELETE"
        }).done((data, status, response) => {
            removeFile(uuid);
            _removeFile(uuid);
        }).fail((request, status, messageError) => {
            displayError("Error : "+messageError);
        });
    }

    static update(file, blob, parseFile, displayError, updateFile){
        $.ajax({
            url: "http://localhost/Filer/public/files/"+file.uuid,
            type: "PATCH",
            data: JSON.stringify(file)
        }).done((data, status, response) => {
            var file = data;
            updateFile(file);
            parseFile(blob, file.uuid);
        }).fail((request, status, messageError) => {
            displayError("Error : "+messageError);
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