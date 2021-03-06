#!/usr/bin/perl

use strict;
use warnings;
use lib "../src/lib/";
use CandiSNP;

sub doWork()
{


	my $snp_file = shift or die "Can't access snp file\n";
	my $allele_freq = shift or die "Can't access allele frequency\n";
	my $genome = shift or die "Can't fine genome name\n";
	my $palette_selected = shift or die "Can't access palette\n";
	my $filter_snps = shift or die "Can't access centromere snp filter value\n";

	##how to run the thing...
	my $big_data = CandiSNP::get_positions_from_file(
		-file => $snp_file,
		-genome => $genome,
		-filter=>$filter_snps
		 );

	##once data is loaded, you can get a unique id for it ...
	my $filetag = CandiSNP::get_filetag($big_data);


	$big_data = CandiSNP::annotate_positions($big_data, -genome => $genome, -filetag => $filetag);

	my $filtered_big_data = CandiSNP::apply_filter($big_data, $allele_freq);
	my $all_genome_lengths = CandiSNP::genome_lengths($genome);
	my ($big_scale_marks, $big_scale_labels) = CandiSNP::scale_marks($all_genome_lengths);
	my $R = CandiSNP::R;


	my $palette = CandiSNP::get_palette($palette_selected);
	my $big_image = CandiSNP::plot_data($R, $filtered_big_data, $filetag, $big_scale_marks, $big_scale_labels,$all_genome_lengths,$palette);

	##dump file of used snps to a csv
	CandiSNP::data_hash_to_file($filtered_big_data,$filetag,-format=>'long');

	##make a nice html table of SNP info for popup from interface
	CandiSNP::data_hash_to_html($filtered_big_data, $filetag, -format=>'long');

	return $filetag;
}
1;
