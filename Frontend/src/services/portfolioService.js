// import axios from 'axios';

// export const updatePortfolio = async (portfolioData) => {
//   const token = localStorage.getItem('token');
//   if (!token) throw new Error('Authentication required');
  
//   try {
//     const response = await axios.post(
//       'http://localhost:5001/api/portfolio',
//       portfolioData,
//       {
//         headers: { Authorization: `Bearer ${token}` }
//       }
//     );
    
//     return response.data;
//   } catch (error) {
//     console.error('Error updating portfolio:', error);
//     throw error;
//   }
// };