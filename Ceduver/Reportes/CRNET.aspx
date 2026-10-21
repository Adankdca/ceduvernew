<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="CRNET.aspx.cs" Inherits="Ceduver.Reportes.CRNET" %>

<%--<%@ Register Assembly="CrystalDecisions.Web, Version=13.0.5000.0, Culture=neutral, PublicKeyToken=692fbea5521e1304" Namespace="CrystalDecisions.Web" TagPrefix="CR" %>--%>
<%@ Register Assembly="CrystalDecisions.Web" Namespace="CrystalDecisions.Web" TagPrefix="CR" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
        <div>
            <CR:CrystalReportViewer ID="crWinNet" runat="server" AutoDataBind="true" Width="350px"/>
        </div>
    </form>
</body>
</html>
