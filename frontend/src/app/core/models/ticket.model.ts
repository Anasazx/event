/** ticketType/dto/TicketTypeResponse.java */
export interface TicketTypeResponse {
  id: number;
  eventId: number;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  soldQuantity: number;
  available: number;
  saleStart: string | null;
  saleEnd: string | null;
  active: boolean;
  onSale: boolean;
}

/** ticketType/dto/TicketTypeRequest.java */
export interface TicketTypeRequest {
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  saleStart: string | null;
  saleEnd: string | null;
  active: boolean;
}
