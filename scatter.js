
//get the chromosome list
function get_chromosomes(data){
  var hash = {};
  for (var i in data ){
    hash[data[i].chromosome] = 1;
  }
  return Object.keys(hash).sort()
}

//get the data for a given chromosome
function select_for(chr,data){
  var result = []
  for (i in data){
    if (data[i].chromosome == chr){
      result.push(data[i]);
    }
  }
  return result;
}


//send the svg to a string
function show_svg_code(){
  // Get the d3js SVG element
  var body = document.body;
  var svg = body.getElementsByTagName("svg")[0];
  // Extract the data as SVG text string
  console.log((new XMLSerializer).serializeToString(svg));
  return (new XMLSerializer).serializeToString(svg);
}

function ratio_current_chromosome_to_longest(species,chr){
  var lengths = genome_lengths(species);
  var current = lengths[chr];
  var keys = Object.keys(lengths);
  var values = keys.map(function(v) { return lengths[v]; });
  var longest = values[0];
  return current / longest;
}

//splits data objext into single sets per chromosome
//adds species specific buttons
function draw(data){
  var chromosomes = get_chromosomes(data);
  var species = $('#species_select').val();


  if (has_centromere_positions(species,chr)){
    add_centromere_select(species,chr);
  }


  for (i in chromosomes){
    var chr = chromosomes[i];
    var single_chr_data = select_for(chr,data);
    draw_single(species, chr,single_chr_data);
  }

}

// actually draws the panels in the plots
function draw_single(species, chr, data){
  "use strict;"

  var svg_id = "chr_" + chr;

  var ratio = ratio_current_chromosome_to_longest(species, chr);
  var margin = 50, width = (ratio * 1000), height = 300;
  //var x_extent = d3.extent(data, function(d){return d.position});
  var x_extent = [1, genome_lengths(species)[chr]];
  var y_extent = d3.extent(data, function(d){return d.allele_freq});


  var x_scale = d3.scale.linear()
  .range([margin,width-margin])
  .domain(x_extent);

  var y_scale = d3.scale.linear()
  .range([height-margin,margin])
  .domain(y_extent);

  var x_axis = d3.svg.axis().scale(x_scale);
  var y_axis = d3.svg.axis().scale(y_scale).orient("left");

  d3.select("body")
  .append('svg')
  .attr("id", svg_id)
  .attr('width',width)
  .attr('height',height)
  .selectAll("circle")
  .data(data)
  .enter()
  .append("circle");

  d3.selectAll("circle")
  .attr("cx", function(d){return x_scale(d.position)})
  .attr("cy", function(d){return y_scale(d.allele_freq)});

  d3.selectAll("circle")
  .attr("r", 0);

  //add class to circles
  d3.selectAll("circle")
   .attr("class", function(d){ return get_snp_type(d) } )
   .style("fill", function(d){
     var snp_type = get_snp_type(d);
     return default_colour(snp_type);
   })


  d3.select('#' + svg_id)
  .append("g")
  .attr("class","x axis")
  .attr("transform", "translate(0," + (height - margin) + " )")
  .call(x_axis);

  d3.select('#' + svg_id)
  .append("g")
  .attr("class","y axis")
  .attr("transform", "translate(" + margin + ",0 )")
  .call(y_axis);

  d3.selectAll("circle")
  .on("mouseover", function(d){
    d3.select(this)
    .transition()
    .attr("r",9);
  })
  .on("mouseout", function(d){
    d3.select(this)
    .transition()
    .attr("r",5);
  });

  d3.selectAll("circle")
  .on("mouseover.tooltip", function(d){
    d3.select("text#" + "snp_" + d.chromosome + "_" + d.position).remove();
    d3.select('#' + "chr_" + d.chromosome)
    .append("text")
    .text(format_popup(d) )
    .attr("x",x_scale(d.position + 10))
    .attr("y",y_scale(d.allele_freq + 0.1))
    .attr("id", "snp_" + d.chromosome + "_" + d.position);
  });

  d3.selectAll("circle")
  .on("mouseout.tooltip", function(d){
    d3.select("text#snp_" + d.chromosome + "_" + d.position)
    .transition()
    .duration(500)
    .style("opacity",0)
    .attr("transform","translate(10,-10)")
    .remove();
  });

  d3.selectAll("circle")
   .transition()
   .delay(function(d,i){ return i / data.length * 250; })
   .attr("r",5);



}

//add the centromere select button
function add_centromere_select(species,chr){
  $('#hide_centromeres_container').append( '<form>Hide Centromere Region SNPs <input type="checkbox" id="hide_centromeres" name="hide_centromeres" value="true"></form>');
  add_centromere_listener(species,chr);
}

//function that creates button to obscure centromeres when the genome selected allows it
function add_centromere_listener(species,chr){
  var centromere_range = has_centromere_positions(species,chr);


  // now add the listener for the select box that does the hiding
  $('#hide_centromeres').change( function(){
    if (this.checked){
        d3.selectAll("circle")
        .filter(function(d,i){
          return (d.position >= centromere_range[0] && d.position <= centromere_range[1]);
        })
        .transition()
        .duration(250)
        .style("opacity",0);

    }
    else{
      d3.selectAll("circle")
      .filter(function(d,i){
        return (d.position >= centromere_range[0] && d.position <= centromere_range[1]);
      })
      .transition()
      .duration(250)
      .style("opacity",1);
    }
  });
}

//function that controls the slider behaviour for the allele freq filter
$(function() {
  $( "#slider-range" ).slider({
    range: true,
    min: 1.0,
    max: 100.0,
    orientation: "horizontal",
    values: [ 75, 100 ],
    slide: function( event, ui ) {
      var max = (ui.values[ 1 ] / 100);
      var min = (ui.values[ 0 ] / 100)
      $( "#amount" ).val( min + " - " + max );
      d3.selectAll("circle")
      .filter(
        function(d,i){
          return ! (d.allele_freq >= min && d.allele_freq <= max )

        })
        .transition()
        .duration(250)
        .style("opacity",0);

        d3.selectAll("circle")
        .filter(
          function(d,i){
            return  (d.allele_freq >= min && d.allele_freq <= max )

          })
          .transition()
          .duration(250)
          .style("opacity",1);



        }
      });
      $( "#amount" ).val(  "0.75 - 1" );
    });

//decide the snp type
function get_snp_type(d){

  if (d.is_synonymous == "FALSE" && d.is_ctga == "TRUE" && d.in_cds == "TRUE"){
    return "NON_SYNONYMOUS_CODING_CT_GA";
  }
  else if(d.is_synonymous == 'FALSE' && d.is_ctga == "FALSE" && d.in_cds == "TRUE" ){
    return "NON_SYNONYMOUS_CODING";
  }
  else if(d.is_synonymous == 'TRUE' && d.is_ctga == "FALSE" && d.in_cds == "TRUE" ){
    return "ANNOTATED_REGION";
  }
  else if( d.in_cds == "FALSE" ){
    return "NON_ANNOTATED_REGION";

  }
  else{
    return "NON_ANNOTATED_REGION";
  }

}

//format the popout string
function format_popup(d){
  // Example object in d  "chromosome":"1","position":825457,"reference_base":"G","alternate_base":"A","allele_freq":0.764705882,"in_cds":"TRUE","is_synonymous":"TRUE","is_ctga":"TRUE","change":"R/R","gene":"AT1G03360","summary":"SYNONYMOUS_CODING"

  return "Location: " + d.chromosome + ":" + d.position + "Nuc Change: " + d.reference_base + "-" + d.alternate_base + "<br>AA Change: " + d.change + "Locus: " + d.gene ;
}

function default_colour(snp_type){

  if(snp_type == "NON_SYNONYMOUS_CODING_CT_GA"){
    return "#ff0000";
  }
  else if (snp_type == "NON_SYNONYMOUS_CODING"){
    return "#ff0000";
  }
  else if (snp_type == "ANNOTATED_REGION"){
    return "#aaaaaa";
  }
  else{
    return "#aaaaaa";
  }

}

function set_spot_colour(colour, snp_type){
  d3.selectAll("." + snp_type)
  .transition()
  .duration(200)
  .style("fill", colour)
}


function colour_settings(default_colour, snp_type){
  return {
    color: default_colour,
    showAlpha: true,
    showPalette:true,
    showPaletteOnly: true,
    togglePaletteOnly: true,
    togglePaletteMoreText: 'more',
    togglePaletteLessText: 'less',
    clickoutFiresChange: true,
    allowEmpty:true,
    change: function(colour) {
      if (colour == null){
        set_spot_colour('rgba(0,0,0,0)', snp_type);
      }
      else{
        set_spot_colour(colour.toRgbString(), snp_type);
      }
    },
    palette: [
    ["#FF0000", "#AAAAAA", "#000000", "#FFFFFF"],
    ["#225EA8", "#41B6C4", "#A1DAB4", "#FFFFCC"],
    ["#D7191C", "#FDAE61", "#2C7BB6", "#ABD9E9"],
    ["#E31A1C", "#FD8D3C", "#FECC5C", "#FFFFB2"],
    ["#CB181D", "#FB6A4A", "#FCAE91", "#FEE5D9"],


    ]
  };
}