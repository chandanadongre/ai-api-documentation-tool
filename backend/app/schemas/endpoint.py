from pydantic import BaseModel
from typing import Optional, List, Any


class ParameterResponse(BaseModel):
    id: str
    name: str
    param_type: str
    data_type: Optional[str]
    required: bool
    description: Optional[str]

    class Config:
        from_attributes = True


class DTOResponse(BaseModel):
    id: str
    name: str
    dto_type: Optional[str]
    source_file: Optional[str]
    fields: Optional[Any]

    class Config:
        from_attributes = True


class EndpointResponse(BaseModel):
    id: str
    project_id: str
    http_method: str
    path: str
    controller_name: Optional[str]
    method_name: Optional[str]
    description: Optional[str]
    auth_required: bool
    source_file: Optional[str]
    parameters: List[ParameterResponse] = []

    class Config:
        from_attributes = True


class AnalyzeRequest(BaseModel):
    project_id: str
    github_url: Optional[str] = None
    github_token: Optional[str] = None
