import { Box, Container } from "@mui/material";
import AdminDashboard from "../../components/admin/AdminDashboard";

export const metadata = {
  title: "Admin | Portfólio audiovisual",
  description: "Painel administrativo local para editar o portfólio audiovisual.",
};

export default function AdminPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: "#F5F7FA",
        background:
          "radial-gradient(circle at 5% -6%, rgba(242, 193, 78, 0.16), transparent 30%), linear-gradient(180deg, #070A10 0%, #0B111B 52%, #080A0F 100%)",
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2.2, md: 3.6 } }}>
        <AdminDashboard />
      </Container>
    </Box>
  );
}
