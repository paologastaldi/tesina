$(document).ready(function(){
    new Clipboard('#btnChannelURL');
    
    if(typeof(page) !== "undefined") $(page).addClass("active"); /*activation of the select menù item*/
    
    /**
     * funzione per controllare i dati della registrazione prima di inviare la richiesta al server
     */
    /*$("#frmSignup").submit(function(event){
        if(($("#txtSignupFirstName").val().trim() === "") || ($("#txtSignupLastName").val().trim() === "") || ($("#txtSignupEmail").val().trim() === "") || ($("#txtSignupPassword").val() === "") || ($("#txtSignupCheckPassword").val() === "")){
            alert("You must compile every field to sign up!");
            event.preventDefault();*/ /*in caso di problemi annullo l'operazione*/
        /*}
        else if($("#txtSignupPassword").val() !== $("#txtSignupCheckPassword").val()){
            alert("Passwords don't match!");
            event.preventDefault();
        }
    });*/
    
    /**
     * funzione per controllare i dati del login prima di inviare la richiesta al server
     */
    /*$("#frmLogin").submit(function(event){
        if(($("#txtLoginEmail").val().trim() === "") || ($("#txtLoginPassword").val().trim() === "")){
            alert("You must compile every field to log in!");
            event.preventDefault();
        }
    });*/
    /*$('#frmSignup').validator().on('submit', function (e) {
        if (e.isDefaultPrevented()) {
        // handle the invalid form...
        } else {
        // everything looks good!
        }
    })
    jQuery("#frmSignup").validate({
        rules: {
            txtSignupPassword:{ 
                required: true,
            }, 
            txtSignupCheckPassword:{ 
                equalTo: "#txtSignupPassword",
            }
        },
        messages:{
            txtSignupCheckPassword:{ 
                equalTo:"Passwords must be equals"
            }
        }
    });*/
    
    /*var images = ["../img/music1.jpg","../img/piano3.jpg","../img/doublebass1.jpg","../img/cello1.jpg","../img/headphones1.jpg"];
    function randomBackgroundImage(element){
        console.log(Math.floor((Math.random()*images.length)));
        element.css({
            "background-image": "url(\"" + images[Math.floor((Math.random()*images.length))] + "\")",
            "background-repeat": "no-repeat",
            "width": "100%",
            "height": "100%"
        });
        console.log(images[Math.floor((Math.random()*images.length))]);
    }
    randomBackgroundImage($(".randomBackground"));*/
    
    $("[name='chkActiveChannel']").bootstrapSwitch();
    if(typeof(chkStatus) !== "undefined") $("[name='chkActiveChannel']").bootstrapSwitch('state', chkStatus); //set status
    
    $('#chkActiveChannel').on('switchChange.bootstrapSwitch', function(event, state){
        console.log("Channel status changed: " + state);
        
        $.ajax({
            url: "/dashboard/channel/activeChannel",
            type: "POST",
            data: {
                channelId: $("#txtChannelId").text(),
                status: state
            },
            dataType: "json",
            success: function(result){
                $("#chkActiveChannel").prop('checked', !$(this).is(':checked')); //it inverts checkbox value
            }
        });
    });
    
    /*channel dashboard: reload channel*/
    $("#btnReloadChannel").click(function(){
        $.ajax({
            url: "/dashboard/channel/reloadChannel",
            type: "POST",
            dataType: "json",
            success: function(){
                BootstrapDialog.show({ //it shows a dialog box
                    title: "Informazione",
                    message: "Canale riavviato"
                });
            },
            error: function(){
                BootstrapDialog.show({ //it shows a dialog box
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Errore",
                    message: "Impossibile riavviare il canale"
                });
            }
        });
    })
    
    var play = true;
    $("#playerBtnPlayPause").click(function(){
        if(play){
            $("#playerAudio").trigger("pause");
            updateAudioSource("");
            $("#playerBtnPlayPauseImg").attr("src", "../../img/play.png");
            play = false;
            console.log("Player: stopped");
        }
        else{
            //$("#playerAudio").currentTime = 0;
            updateAudioSource("/website/listenTo?id=" + $("#txChannelId").val() + "&quality=" + quality); //creating source url
            $("#playerAudio").trigger("play");
            $("#playerBtnPlayPauseImg").attr("src", "../../img/stop.png");
            play = true;
            console.log("Player: played");
        }
    });
    
    $("#playerBtnPlayPause").on("error", function(err){
        if(err.target.error.code == err.target.error.MEDIA_ERR_NETWORK){
            alert(err);
           //abbassa qualità
           setTimeout(updateAudioSource("/website/listenTo?id=" + $("#txChannelId").val() + "&quality=" + quality), 5000);
        } 
    });
    
    /*player slider*/
    $("#playerVolumeSlider").slider({
        orientation: "orizontal",
        range: "min",
        min: 0,
        max: 100,
        value: 100, //default value
        step: 2,
        slide: function(event, ui) {
            var volume = ui.value / 100; //percentage required
            $("#playerAudio").prop("volume", volume);
            
            //changing volume icon
            if(volume > 0.75) $("#playerImgVolume").attr("src", "../../img/highVolume.png");
            else if(volume > 0.25) $("#playerImgVolume").attr("src", "../../img/mediumVolume.png");
            else if(volume > 0) $("#playerImgVolume").attr("src", "../../img/lowVolume.png");
            else $("#playerImgVolume").attr("src", "../../img/muteVolume.png");
        }
    });
    $("#playerAudio").volume = $("playerVolumeSlider").slider("value");
    
    /*player button*/
    $("#playerBtnPlayPause").mouseover(function(){
        $("#playerBtnPlayPauseImg").fadeTo(200, 0.8);
    });
    $("#playerBtnPlayPause").mouseout(function(){
        $("#playerBtnPlayPauseImg").fadeTo(200, 0);
    });
    
    /*player quality selector*/
    $("#cmbQualities").change(updateAudioSource);
    
    /*playlist tracks*/
    $("ol.sortableList").sortable({
        group: 'no-drop',
        handle: 'i.icon-move',
        onDragStart: function ($item, container, _super) {
            // Duplicate items of the no drop area
            if(!container.options.drop)
              $item.clone().insertAfter($item);
            _super($item, container);
        }
    });
    
    if(typeof(errorCodes) !== "undefined"){
        for(var i=0; i<errorCodes.length; i++){
            BootstrapDialog.show({ //it shows a dialog box for every error
                type: BootstrapDialog.TYPE_DANGER,
                title: "Errore",
                message: errorMessages[errorCodes[i]] //there is a specific file included
            });
        }
    }
    
    $("#frmLoadTracks").submit(function(){
        BootstrapDialog.show({ //it shows a dialog box for every error
            type: BootstrapDialog.TYPE_WARNING,
            title: "Caricamento",
            message: "Caricamento in corso dei file selezionati. Non cambiare pagina fino al termine dell'operazione."
        });
    });
    
    $("#frmChangeThumbnail").submit(function(){
        BootstrapDialog.show({ //it shows a dialog box for every error
            type: BootstrapDialog.TYPE_WARNING,
            title: "Caricamento",
            message: "Caricamento in corso della nuova thumbnail. Non cambiare pagina fino al termine dell'operazione."
        });
        $("#btnChangeThumbnail").enableButtons(false);
    });
});

var initialMetadata = true;
function getMetadata(){
    $.ajax({
        url: "/website/getMetadata",
        type: "POST",
        data: {
            channelId: $("#txChannelId").val(),
            init: initialMetadata
        },
        dataType: "json",
        success: function(metadata){
            if(typeof(metadata.title) === "string" && metadata.title.trim() !== "") $("#txtPlayerTrackTitle").text(metadata.title.toUpperCase()); //if null -> typeof = object
            else $("#txtPlayerTrackTitle").text("TITOLO SCONOSCIUTO");
            
            if(typeof(metadata.author) === "string" && metadata.author.trim() !== "") $("#txtPlayerAuthor").text(metadata.author)
            else $("#txtPlayerAuthor").text("Autore sconosciuto");
            
            if(typeof(metadata.thumbnail) === "string" && metadata.thumbnail.trim() !== "" && metadata.thumbnail !== "null") $("#playerThumbnail").attr("src", "../../img/" + metadata.thumbnail);
            else $("#playerThumbnail").attr("src", "../../img/defaultThumbnail.jpg");
            
            initialMetadata = false;
            getMetadata(); //recursive function to get metadata of the next track
        }
    });
}

var quality = 128; //default quality
    
/*function to update audio source url*/
function updateAudioSource(){
    quality = $("#cmbQualities").val();
    var source = "/website/listenTo?id=" + $("#txtChannelId").val() + "&quality=" + quality;
    
    $("#playerAudioSource").attr("src", source);
    console.log("Source resetted");
    
    $("#playerAudio").trigger("load"); //forcing reset
    $("#playerAudio").trigger("play");
    
    $("#txtChannelURL").val(window.location.hostname + (window.location.port ? ':' + window.location.port : '') + source);
}