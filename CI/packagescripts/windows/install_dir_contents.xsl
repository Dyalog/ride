<xsl:stylesheet version="1.0"
		xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		xmlns:wix="http://schemas.microsoft.com/wix/2006/wi">
	<xsl:output omit-xml-declaration="yes" method="xml" indent="yes" version="1.0"/>
	
	<!--
		LMF [6845] 08-Feb-2011
		This transformation document is to be used in conjunction with the Wix Harvest Tool (Heat)
		via the install_dir_contents function of the make.ksh build script.
		
		Features of the transform:
		- Convert the root element from "Wix" to "Include"
		- Remove any files/subfolders of the .svn hidden folder from the original harvested directory
		- Create a "ComponentGroup" element that simply contains a list of "ComponentRef" elements that refer to all the "wix:Component" elements in the xml
	-->
	
	<!--
		Identity Templates
		These are used to pull in every node/attribute in the original XML document.
		Please note:
		- The wix:* match template is used to remove redundant references to the wix namespace
	-->
	<xsl:template match="wix:*">
		<xsl:element name="{local-name()}">
			<xsl:apply-templates select="@* | node()"/>
		</xsl:element>
	</xsl:template>
	<xsl:template match="@* | node()">
		<xsl:copy>
			<xsl:apply-templates select="@* | node()" />
		</xsl:copy>
	</xsl:template>

	<!-- Custom output for a Wix element -->
 	<xsl:template match="wix:Wix">
		<xsl:element name="Include">
			<!-- Component Groups -->
			<xsl:call-template name="CreateComponentGroup" />
			
			<!-- Files -->
			<xsl:apply-templates select="@* | node()" />
		</xsl:element>
	</xsl:template>
	<!-- We have to special case wix:Component so that we can add attributes -->
 	<xsl:template match="wix:Component">
		<xsl:element name="{local-name()}">
			<xsl:apply-templates select="@*" />
			<xsl:attribute name="Win64">$(env.IS_WIN64)</xsl:attribute>
			<!-- LMF [7131] 30-Mar-2011 Add disk id attribute -->
			<xsl:attribute name="DiskId">1</xsl:attribute>
			<xsl:apply-templates select="node()" />
		</xsl:element>
	</xsl:template>
	<!--
		LMF [8121] 23-Feb-2012
		We have to special case wix:Directory and wix:DirectoryRef so that we can manipulate the Id attribute
	-->
 	<xsl:template match="wix:Directory
						| wix:DirectoryRef[not(contains(@Id,'INSTALLDIR'))]">
		<xsl:element name="{local-name()}">
			<xsl:attribute name="Id">dir_heated_<xsl:value-of select="@Id" /></xsl:attribute>
			<xsl:apply-templates select="@*[not(name() = 'Id')]" />
			<xsl:apply-templates select="node()" />
		</xsl:element>
	</xsl:template>
	
	<!--
		Suppression elements
		Code to blacklist elements from the original XML being copied into the resultant wxi file
		
		Notes:
		- The "contains" function is a XPath string function, which in the cases below are comparing the string values of specific node attribute names.
		- This transform relies on the naming convention of heat, if this changes then the transform may break
	-->
	<xsl:template match="wix:Fragment[.//*[contains(@Id,'.svn')]]" />
	
	<!-- Standard Templates -->
	<xsl:template name="CreateComponentGroup">
		<xsl:element name="Fragment">
			<xsl:variable name="ComponentGroupName">
				<!-- Note: This variable's value relies on the fact that heat has been used with the switch -dr INSTALLDIR -->
				<xsl:value-of select=".//wix:DirectoryRef[@Id='INSTALLDIR']/wix:Directory/@Id" />
			</xsl:variable>
			<xsl:element name="ComponentGroup">
				<xsl:attribute name="Id"><xsl:value-of select="$ComponentGroupName" />Files</xsl:attribute>
				<!--
					For each select statement acts as a blacklist to prevent
					unwanted component groups from being created in the resultant wxi
				-->
				<xsl:for-each select=".//wix:Component[not(ancestor::*[contains(@Id,'.svn')]
															or descendant::*[contains(@Id,'.svn')])]">
						<xsl:element name="ComponentRef" >
							<xsl:attribute name="Id"><xsl:value-of select="@Id"/></xsl:attribute>
						</xsl:element>
				</xsl:for-each>
			</xsl:element>
		</xsl:element>
	</xsl:template>
</xsl:stylesheet>
