# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

from google.protobuf import empty_pb2 as google_dot_protobuf_dot_empty__pb2
import reader_pb2 as reader__pb2


class ReaderStub(object):
    """Query an external source.
    The functions in this service are implemented by a non-iModel.js "reader" program. They are called by an iModel.js connector. They
    give the iModel.js connector a way to fetch data from an external source that is not directly accessible to it. The "reader" program is the intermediary.
    The main function is `getData`. The reader program should implement this by *streaming* all of the data in the external source back to the requesting connector.
    The `onBriefcaseServerAvailable` function gives the reader the address of a service that is implemented by the iModel.js program. See briefcase.proto.
    The reader program can use the briefcase service to send queries back to the connector. The reader can even send briefcase requests to the connector (and wait for answers)
    while in the midst of handling a request from the connector.
    """

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.initialize = channel.unary_unary(
                '/TwoProcessConnector.Reader/initialize',
                request_serializer=reader__pb2.InitializeRequest.SerializeToString,
                response_deserializer=reader__pb2.InitializeResponse.FromString,
                )
        self.onBriefcaseServerAvailable = channel.unary_unary(
                '/TwoProcessConnector.Reader/onBriefcaseServerAvailable',
                request_serializer=reader__pb2.OnBriefcaseServerAvailableParams.SerializeToString,
                response_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                )
        self.getData = channel.unary_stream(
                '/TwoProcessConnector.Reader/getData',
                request_serializer=reader__pb2.GetDataRequest.SerializeToString,
                response_deserializer=reader__pb2.GetDataResponse.FromString,
                )
        self.shutdown = channel.unary_unary(
                '/TwoProcessConnector.Reader/shutdown',
                request_serializer=reader__pb2.ShutdownRequest.SerializeToString,
                response_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                )


class ReaderServicer(object):
    """Query an external source.
    The functions in this service are implemented by a non-iModel.js "reader" program. They are called by an iModel.js connector. They
    give the iModel.js connector a way to fetch data from an external source that is not directly accessible to it. The "reader" program is the intermediary.
    The main function is `getData`. The reader program should implement this by *streaming* all of the data in the external source back to the requesting connector.
    The `onBriefcaseServerAvailable` function gives the reader the address of a service that is implemented by the iModel.js program. See briefcase.proto.
    The reader program can use the briefcase service to send queries back to the connector. The reader can even send briefcase requests to the connector (and wait for answers)
    while in the midst of handling a request from the connector.
    """

    def initialize(self, request, context):
        """Tell the reader to initialize. The input file to the connector is passed as a parameter, in case the Reader wants to open that or use it in some way. 
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def onBriefcaseServerAvailable(self, request, context):
        """Inform the Reader that a server is now available to take requests to query the briefcase 
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def getData(self, request, context):
        """The Reader should send the data in the external source to the client (in a stream) 
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def shutdown(self, request, context):
        """The Reader should shut down 
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_ReaderServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'initialize': grpc.unary_unary_rpc_method_handler(
                    servicer.initialize,
                    request_deserializer=reader__pb2.InitializeRequest.FromString,
                    response_serializer=reader__pb2.InitializeResponse.SerializeToString,
            ),
            'onBriefcaseServerAvailable': grpc.unary_unary_rpc_method_handler(
                    servicer.onBriefcaseServerAvailable,
                    request_deserializer=reader__pb2.OnBriefcaseServerAvailableParams.FromString,
                    response_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            ),
            'getData': grpc.unary_stream_rpc_method_handler(
                    servicer.getData,
                    request_deserializer=reader__pb2.GetDataRequest.FromString,
                    response_serializer=reader__pb2.GetDataResponse.SerializeToString,
            ),
            'shutdown': grpc.unary_unary_rpc_method_handler(
                    servicer.shutdown,
                    request_deserializer=reader__pb2.ShutdownRequest.FromString,
                    response_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'TwoProcessConnector.Reader', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class Reader(object):
    """Query an external source.
    The functions in this service are implemented by a non-iModel.js "reader" program. They are called by an iModel.js connector. They
    give the iModel.js connector a way to fetch data from an external source that is not directly accessible to it. The "reader" program is the intermediary.
    The main function is `getData`. The reader program should implement this by *streaming* all of the data in the external source back to the requesting connector.
    The `onBriefcaseServerAvailable` function gives the reader the address of a service that is implemented by the iModel.js program. See briefcase.proto.
    The reader program can use the briefcase service to send queries back to the connector. The reader can even send briefcase requests to the connector (and wait for answers)
    while in the midst of handling a request from the connector.
    """

    @staticmethod
    def initialize(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/TwoProcessConnector.Reader/initialize',
            reader__pb2.InitializeRequest.SerializeToString,
            reader__pb2.InitializeResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def onBriefcaseServerAvailable(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/TwoProcessConnector.Reader/onBriefcaseServerAvailable',
            reader__pb2.OnBriefcaseServerAvailableParams.SerializeToString,
            google_dot_protobuf_dot_empty__pb2.Empty.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def getData(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_stream(request, target, '/TwoProcessConnector.Reader/getData',
            reader__pb2.GetDataRequest.SerializeToString,
            reader__pb2.GetDataResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def shutdown(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/TwoProcessConnector.Reader/shutdown',
            reader__pb2.ShutdownRequest.SerializeToString,
            google_dot_protobuf_dot_empty__pb2.Empty.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)
