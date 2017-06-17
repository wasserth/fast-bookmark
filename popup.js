var folders;
var homeFolderId = "1"; //"Lesezeichenleiste";

$(function() {

    folders = new Array();
    buildSelectOptions();

    var currentTab;
    chrome.tabs.getSelected(null, function(tab) {
        currentTab = tab;
        $("#inputTitle").val(currentTab.title);
    });

    $("body").on("keyup", ".select2-input", function(event) {

        if (event.which === 13) {
            var inputStr = $(".select2-input").val();
            if (inputStr.indexOf(">") !== -1) {
                var elems = inputStr.split(">");

                //new folder on homeFolder level
                if (elems[0] === "") {
                    var newFolderName = elems[1].trim();

                    //create new folder
                    chrome.bookmarks.create({
                        parentId: homeFolderId,
                        title: newFolderName});

                    //save bookmark in new folder
                    folders = new Array();
                    findFolderNode({"title": newFolderName}, function() {
                        chrome.bookmarks.create({
                            parentId: folders[0].id,
                            title: $("#inputTitle").val(),
                            url: currentTab.url});
                        window.close();
                    });

                } else { //new folder within other user defined folder

                    var parentFolderName = elems[0].trim();
                    var newFolderName = elems[1].trim();

                    //create new folder
                    folders = new Array();
                    findFolderNode({"title": parentFolderName}, function() {
                        chrome.bookmarks.create({
                            parentId: folders[0].id,
                            title: newFolderName});

                        //save bookmark in new folder
                        folders = new Array();
                        findFolderNode({"title": newFolderName}, function() {
                            chrome.bookmarks.create({
                                parentId: folders[0].id,
                                title: $("#inputTitle").val(),
                                url: currentTab.url});
                            window.close();
                        });
                    });
                }

            }
        }
    });

	setTimeout(function() {
		$("#select-box").select2('open');
	//        if (!select2.opened()) {
	//            select2.open();
	//        }
	    }, 100);

    $("#select-box").change(function() {
        chrome.bookmarks.create({
            parentId: $("#select-box").val(),
            title: $("#inputTitle").val(),
            url: currentTab.url});
        window.close();
    });

    $("#submitBtn").click(function(e) {
        if ($("#select-box").val() === "") {
            e.preventDefault();
            $("#notifications").show();
            $("#notifications").html('Choose a folder');
        } else {
            chrome.bookmarks.create({
                parentId: $("#select-box").val(),
                title: $("#inputTitle").val(),
                url: currentTab.url});
            window.close();
        }
    });
});

function buildSelectOptions() {
    var query = "";
    chrome.bookmarks.getTree(
            function(bookmarkTreeNodes) {
                processArrayOfNodes(bookmarkTreeNodes, query);
                for (i = 0; i < folders.length; i++) {
                    $("#select-box").append($("<option value=" + folders[i].id + ">" + folders[i].title + "</option>"));
                }
                $(".select2").select2();
            });
}

function findFolderNode(query, callback) {
    chrome.bookmarks.getTree(
            function(bookmarkTreeNodes) {
                processArrayOfNodes(bookmarkTreeNodes, query);
                if (folders.length === 0) {
                    $("#notifications").show();
                    $("#notifications").html('Folder not found');
                } else {
                    callback();
                }
            });
}

function processArrayOfNodes(bookmarkNodes, query) {
    for (var i = 0; i < bookmarkNodes.length; i++) {
        processNode(bookmarkNodes[i], query);
    }
}

function processNode(bookmarkNode, query) {
    if (!bookmarkNode.url) {
        if (query === ""
                || (query.title && bookmarkNode.title === query.title)
                || (query.id && bookmarkNode.id === query.id)) {
            folders.push({"title": bookmarkNode.title, "id": bookmarkNode.id});
        }
        if (bookmarkNode.children && bookmarkNode.children.length > 0) {
            processArrayOfNodes(bookmarkNode.children, query);
        }
    }
}
